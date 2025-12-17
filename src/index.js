import './style.css'
import { auth } from './firebaseConfig.js'
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth'

// 관리자 UID
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

// 페이지 초기 HTML 구조
document.querySelector('#app').innerHTML = `
  <h1>AIM</h1>
  <p class="subtitle">Analyze problem, Identify task, Model selection</p>
  <p>고등학교 2학년 '인공지능과 미래사회' 교과의 프로젝트 수업에서 사용할 웹 사이트입니다.</p>
  <p>프로젝트 주제 선정을 위한 단계별 가이드를 제공합니다.</p>
  
  <div id="auth-container" style="text-align: center; margin: 20px 0;">
    <button id="google-login" style="display: none;">🔐 Google 로그인</button>
    <div id="user-info" style="display: none;">
      <p>환영합니다, <span id="user-name"></span>님!</p>
      <button id="logout-btn">로그아웃</button>
    </div>
  </div>
  
  <div id="navigation-buttons" style="display: none; margin-top: 20px; text-align: center;">
    <button id="student-btn">학생으로 시작하기</button>
    <button id="teacher-btn" style="display: none;">교사 모니터링</button>
  </div>
`

// DOM 요소 참조
const googleLoginBtn = document.querySelector('#google-login')
const logoutBtn = document.querySelector('#logout-btn')
const userInfo = document.querySelector('#user-info')
const userName = document.querySelector('#user-name')
const navigationButtons = document.querySelector('#navigation-buttons')
const studentBtn = document.querySelector('#student-btn')
const teacherBtn = document.querySelector('#teacher-btn')

// Google 로그인 함수
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    console.log('로그인 성공:', result.user)
  } catch (error) {
    console.error('로그인 오류:', error)
    alert('로그인에 실패했습니다. 다시 시도해주세요.')
  }
}

// 로그아웃 함수
const handleLogout = async () => {
  try {
    await signOut(auth)
    console.log('로그아웃 성공')
  } catch (error) {
    console.error('로그아웃 오류:', error)
    alert('로그아웃에 실패했습니다.')
  }
}

// 인증 상태 변화 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인 상태
    googleLoginBtn.style.display = 'none'
    userInfo.style.display = 'block'
    navigationButtons.style.display = 'block'
    userName.textContent = user.displayName || user.email
    
    // 관리자 권한 확인
    if (user.uid === ADMIN_UID) {
      teacherBtn.style.display = 'inline-block'
      console.log('관리자 로그인 상태:', user)
    } else {
      teacherBtn.style.display = 'none'
      console.log('일반 사용자 로그인 상태:', user)
    }
  } else {
    // 로그아웃 상태
    googleLoginBtn.style.display = 'block'
    userInfo.style.display = 'none'
    navigationButtons.style.display = 'none'
    teacherBtn.style.display = 'none'
    console.log('사용자 로그아웃 상태')
  }
})

// 이벤트 리스너 등록
googleLoginBtn.addEventListener('click', signInWithGoogle)
logoutBtn.addEventListener('click', handleLogout)
studentBtn.addEventListener('click', () => {
  window.location.href = 'student.html'
})
teacherBtn.addEventListener('click', () => {
  window.location.href = 'teacherMonitor.html'
})

