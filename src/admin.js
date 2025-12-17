import './style.css'
import { auth } from './firebaseConfig.js'
import { onAuthStateChanged } from 'firebase/auth'

// 관리자 UID
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

// 초기 UI 렌더링
document.querySelector('#app').innerHTML = `
  <h1>교사 모니터링 페이지</h1>
  <p>학생들의 진행 상황을 모니터링하세요.</p>
  <button onclick="window.location.href='index.html'">홈으로 돌아가기</button>
`

// 인증 상태 확인 및 관리자 권한 체크
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인은 되어있지만 관리자가 아닌 경우
    if (user.uid !== ADMIN_UID) {
      alert('접근 권한이 없습니다. 관리자만 접근할 수 있습니다.')
      window.location.href = 'index.html'
    } else {
      console.log('관리자 접근 허용:', user.email)
    }
  } else {
    // 로그인하지 않은 경우
    alert('로그인이 필요합니다.')
    window.location.href = 'index.html'
  }
})
