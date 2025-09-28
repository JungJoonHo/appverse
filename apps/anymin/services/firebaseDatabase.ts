import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  ENTITY_SCHEDULES,
  ENTITY_MEMOS,
  ENTITY_CALL_RECORDS,
} from "../constants/firebase";

export interface Schedule {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CallRecord {
  id?: string;
  user_id: string;
  phone_number: string;
  caller_name: string;
  call_type: "incoming" | "outgoing" | "missed";
  duration: number;
  call_date: string;
  audio_file_path?: string;
  transcription?: string;
  is_transcribed: boolean;
  created_at: string;
  updated_at: string;
}

class FirebaseDatabaseService {
  // 일정 관련 메서드
  async create_schedule(schedule: Omit<Schedule, "id">): Promise<string> {
    try {
      const doc_ref = await addDoc(collection(db, ENTITY_SCHEDULES.NAME), {
        ...schedule,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      return doc_ref.id;
    } catch (error) {
      console.error("Error creating schedule:", error);
      throw error;
    }
  }

  async get_schedules(
    user_id: string,
    start_date?: string,
    end_date?: string,
  ): Promise<Schedule[]> {
    try {
      let q = query(
        collection(db, ENTITY_SCHEDULES.NAME),
        where("user_id", "==", user_id),
        orderBy("start_time", "asc"),
      );

      if (start_date && end_date) {
        q = query(
          collection(db, ENTITY_SCHEDULES.NAME),
          where("user_id", "==", user_id),
          where("start_time", ">=", start_date),
          where("start_time", "<=", end_date),
          orderBy("start_time", "asc"),
        );
      }

      const query_snapshot = await getDocs(q);
      const schedules: Schedule[] = [];

      query_snapshot.forEach((doc) => {
        const data = doc.data();
        schedules.push({
          id: doc.id,
          user_id: data.user_id,
          title: data.title,
          description: data.description,
          start_time: data.start_time,
          end_time: data.end_time,
          is_all_day: data.is_all_day,
          created_at:
            data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at:
            data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        });
      });

      return schedules;
    } catch (error) {
      console.error("Error getting schedules:", error);
      throw error;
    }
  }

  async update_schedule(
    id: string,
    schedule: Partial<Schedule>,
  ): Promise<void> {
    try {
      const schedule_ref = doc(db, ENTITY_SCHEDULES.NAME, id);
      await updateDoc(schedule_ref, {
        ...schedule,
        updated_at: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  }

  async delete_schedule(id: string): Promise<void> {
    try {
      const schedule_ref = doc(db, ENTITY_SCHEDULES.NAME, id);
      await deleteDoc(schedule_ref);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  }

  // 메모 관련 메서드
  async create_memo(
    memo: Omit<Memo, "id" | "created_at" | "updated_at">,
  ): Promise<string> {
    try {
      const doc_ref = await addDoc(collection(db, ENTITY_MEMOS.NAME), {
        ...memo,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      return doc_ref.id;
    } catch (error) {
      console.error("Error creating memo:", error);
      throw error;
    }
  }

  async get_memos(user_id: string): Promise<Memo[]> {
    try {
      const q = query(
        collection(db, ENTITY_MEMOS.NAME),
        where("user_id", "==", user_id),
        orderBy("updated_at", "desc"),
      );

      const query_snapshot = await getDocs(q);
      const memos: Memo[] = [];

      query_snapshot.forEach((doc) => {
        const data = doc.data();
        memos.push({
          id: doc.id,
          user_id: data.user_id,
          title: data.title,
          content: data.content,
          created_at:
            data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at:
            data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        });
      });

      return memos;
    } catch (error) {
      console.error("Error getting memos:", error);
      throw error;
    }
  }

  async get_memo(id: string): Promise<Memo | null> {
    try {
      const memo_ref = doc(db, ENTITY_MEMOS.NAME, id);
      const memo_snap = await getDoc(memo_ref);

      if (memo_snap.exists()) {
        const data = memo_snap.data();
        return {
          id: memo_snap.id,
          user_id: data.user_id,
          title: data.title,
          content: data.content,
          created_at:
            data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at:
            data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting memo:", error);
      throw error;
    }
  }

  async update_memo(id: string, memo: Partial<Memo>): Promise<void> {
    try {
      const memo_ref = doc(db, ENTITY_MEMOS.NAME, id);
      await updateDoc(memo_ref, {
        ...memo,
        updated_at: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating memo:", error);
      throw error;
    }
  }

  async delete_memo(id: string): Promise<void> {
    try {
      const memo_ref = doc(db, ENTITY_MEMOS.NAME, id);
      await deleteDoc(memo_ref);
    } catch (error) {
      console.error("Error deleting memo:", error);
      throw error;
    }
  }

  // 통화 기록 관련 메서드
  async create_call_record(
    call_record: Omit<CallRecord, "id" | "created_at" | "updated_at">,
  ): Promise<string> {
    try {
      const doc_ref = await addDoc(collection(db, ENTITY_CALL_RECORDS.NAME), {
        ...call_record,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      return doc_ref.id;
    } catch (error) {
      console.error("Error creating call record:", error);
      throw error;
    }
  }

  async get_call_records(user_id: string): Promise<CallRecord[]> {
    try {
      const q = query(
        collection(db, ENTITY_CALL_RECORDS.NAME),
        where("user_id", "==", user_id),
        orderBy("call_date", "desc"),
      );

      const query_snapshot = await getDocs(q);
      const call_records: CallRecord[] = [];

      query_snapshot.forEach((doc) => {
        const data = doc.data();
        call_records.push({
          id: doc.id,
          user_id: data.user_id,
          phone_number: data.phone_number,
          caller_name: data.caller_name,
          call_type: data.call_type,
          duration: data.duration,
          call_date: data.call_date,
          audio_file_path: data.audio_file_path,
          transcription: data.transcription,
          is_transcribed: data.is_transcribed,
          created_at:
            data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at:
            data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        });
      });

      return call_records;
    } catch (error) {
      console.error("Error getting call records:", error);
      throw error;
    }
  }

  async update_call_record(
    id: string,
    call_record: Partial<CallRecord>,
  ): Promise<void> {
    try {
      const call_record_ref = doc(db, ENTITY_CALL_RECORDS.NAME, id);
      await updateDoc(call_record_ref, {
        ...call_record,
        updated_at: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating call record:", error);
      throw error;
    }
  }

  async delete_call_record(id: string): Promise<void> {
    try {
      const call_record_ref = doc(db, ENTITY_CALL_RECORDS.NAME, id);
      await deleteDoc(call_record_ref);
    } catch (error) {
      console.error("Error deleting call record:", error);
      throw error;
    }
  }
}

export const firebase_database_service = new FirebaseDatabaseService();
