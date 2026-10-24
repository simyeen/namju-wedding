# 남일 · 주희 모바일 청첩장

HTML, CSS, JavaScript와 이미지로 구성된 정적 사이트입니다.

## 로컬 실행

현재 사용하는 최신 소스 위치는 `/Users/namilkim/Desktop/workspace/namju-wedding`입니다.
서버 실행 요청 시 이 폴더에서 아래 명령을 사용하고, **포트는 3000으로 고정**합니다.
8000번 포트나 `python3 -m http.server`로 실행하지 않습니다. 편지 조회 API도 처리하는 Node 개발 서버를 사용합니다.

```sh
cd /Users/namilkim/Desktop/workspace/namju-wedding
npm run dev
```

- Mac: http://localhost:3000
- 모바일: Mac과 같은 Wi-Fi에 연결한 뒤 `http://<Mac의 로컬 IP>:3000`으로 접속합니다.
- 개발 서버는 `0.0.0.0:3000`으로 수신하므로 모바일 접속이 가능합니다.
- Mac의 Wi-Fi IP 확인: `ipconfig getifaddr en0` (네트워크가 바뀌면 IP도 달라질 수 있습니다.)

예전 사본 `/Users/namilkim/Documents/ChatGPT/남주모청/namju-wedding`은 삭제했습니다. 해당 경로를 다시 만들거나 실행 대상으로 사용하지 않습니다.

## 주요 기능

- 애니메이션 표지와 스크롤 등장 효과
- 전체 화면 사진 갤러리: 화살표, 키보드, 스와이프 및 사진 번호
- 달력 저장, 지도·길찾기, 계좌 복사, 청첩장 공유
- 이름과 전화번호 끝 네 자리로 편지 열기, FAQ

## 배포 설정

Vercel에서 저장소 루트를 정적 사이트로 사용합니다. `vercel.json`은 달력 파일의 응답 형식을 지정합니다.
환경 파일(`.env*`)과 로컬 Vercel 연결 정보(`.vercel/`)는 Git에서 제외합니다.
