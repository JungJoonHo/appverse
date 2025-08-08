export const ENTITY_ADMIN_USERS = {
    NAME: 'admin_users',
    FIELDS: {
        NAME: 'name',
        USER_ID: 'user_id',
        PHONE: 'phone',
        CREATED_AT: 'created_at',
    }
} as const;

export const ENTITY_USERS = {
    NAME: 'users',
    FIELDS: {
        NAME: 'name',
        EMAIL: 'email',
        PHONE: 'phone',
        CREATED_AT: 'created_at',
        CREATED_BY: 'created_by',
    }
} as const;

export const ENTITY_SCHEDULES = {
    NAME: 'schedules',
    FIELDS: {
        USER_ID: 'user_id',
        TITLE: 'title',
        DESCRIPTION: 'description',
        START_TIME: 'start_time',
        END_TIME: 'end_time',
        IS_ALL_DAY: 'is_all_day',
        LOCATION: 'location',
        STATUS: 'status',
        PRIORITY: 'priority',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at',
        CREATED_BY: 'created_by',
    }
} as const;

export const ENTITY_MEMOS = {
    NAME: 'memos',
    FIELDS: {
        USER_ID: 'user_id',
        TITLE: 'title',
        CONTENT: 'content',
        CATEGORY: 'category',
        TAGS: 'tags',
        IS_IMPORTANT: 'is_important',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at',
        CREATED_BY: 'created_by',
    }
} as const;

// 타입 정의
export type EntityName = 
    | typeof ENTITY_ADMIN_USERS.NAME
    | typeof ENTITY_USERS.NAME
    | typeof ENTITY_SCHEDULES.NAME
    | typeof ENTITY_MEMOS.NAME;

// 엔티티별 필드 타입 정의
export interface AdminUserFields {
    [ENTITY_ADMIN_USERS.FIELDS.NAME]: string;
    [ENTITY_ADMIN_USERS.FIELDS.USER_ID]: string;
    [ENTITY_ADMIN_USERS.FIELDS.PHONE]: string;
    [ENTITY_ADMIN_USERS.FIELDS.CREATED_AT]: Date;
}

export interface UserFields {
    [ENTITY_USERS.FIELDS.NAME]: string;
    [ENTITY_USERS.FIELDS.EMAIL]: string;
    [ENTITY_USERS.FIELDS.PHONE]: string;
    [ENTITY_USERS.FIELDS.CREATED_AT]: Date;
    [ENTITY_USERS.FIELDS.CREATED_BY]: string;
}

export interface ScheduleFields {
    [ENTITY_SCHEDULES.FIELDS.USER_ID]: string;
    [ENTITY_SCHEDULES.FIELDS.TITLE]: string;
    [ENTITY_SCHEDULES.FIELDS.DESCRIPTION]?: string;
    [ENTITY_SCHEDULES.FIELDS.START_TIME]: string;
    [ENTITY_SCHEDULES.FIELDS.END_TIME]?: string;
    [ENTITY_SCHEDULES.FIELDS.IS_ALL_DAY]: boolean;
    [ENTITY_SCHEDULES.FIELDS.LOCATION]?: string;
    [ENTITY_SCHEDULES.FIELDS.STATUS]?: string;
    [ENTITY_SCHEDULES.FIELDS.PRIORITY]?: string;
    [ENTITY_SCHEDULES.FIELDS.CREATED_AT]: Date;
    [ENTITY_SCHEDULES.FIELDS.UPDATED_AT]: Date;
    [ENTITY_SCHEDULES.FIELDS.CREATED_BY]?: string;
}

export interface MemoFields {
    [ENTITY_MEMOS.FIELDS.USER_ID]: string;
    [ENTITY_MEMOS.FIELDS.TITLE]: string;
    [ENTITY_MEMOS.FIELDS.CONTENT]: string;
    [ENTITY_MEMOS.FIELDS.CATEGORY]?: string;
    [ENTITY_MEMOS.FIELDS.TAGS]?: string[];
    [ENTITY_MEMOS.FIELDS.IS_IMPORTANT]: boolean;
    [ENTITY_MEMOS.FIELDS.CREATED_AT]: Date;
    [ENTITY_MEMOS.FIELDS.UPDATED_AT]: Date;
    [ENTITY_MEMOS.FIELDS.CREATED_BY]?: string;
} 