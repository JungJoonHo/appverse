import express from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import cors from 'cors';

const app = express();
const port = 3001;

// CORS 미들웨어 사용
app.use(cors());

// 파일이 업로드될 디렉토리
const uploadDir = path.join(__dirname, '..', 'uploads');

// 'uploads' 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정을 통해 파일을 디스크에 저장
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 파일 이름 중복을 피하기 위해 타임스탬프를 추가
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// 파일 업로드를 위한 POST 엔드포인트
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('파일이 업로드되지 않았습니다.');
  }

  // 클라이언트에게 파일 URL을 반환
  const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
});

// 업로드된 파일을 제공하기 위한 정적 파일 서버
app.use('/files', express.static(uploadDir));

app.listen(port, () => {
  console.log(`로컬 스토리지 서버가 http://localhost:${port} 에서 실행 중입니다.`);
}); 