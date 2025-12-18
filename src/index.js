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
  <div class="home-header">
    <h1>🎯 AIM</h1>
    <p class="subtitle">Analyze problem, Identify task, Model selection</p>
    <p> 문제를 분석하고 정의한 뒤, 적합한 모델을 선정해보자.</p>
  </div>
  
  <div class="info-cards">
    <div class="info-card">
      <div class="card-icon">🎓</div>
      <h3>대상</h3>
      <p>고등학교 2학년<br>'인공지능과 미래사회' 교과</p>
    </div>
    <div class="info-card">
      <div class="card-icon">📋</div>
      <h3>목적</h3>
      <p>AI 프로젝트 주제 선정을 위한<br>단계별 가이드 제공</p>
    </div>
    <div class="info-card">
      <div class="card-icon">🚀</div>
      <h3>과정</h3>
      <p>문제 탐색 → 정의 → 검증 →<br>모델 선택</p>
    </div>
  </div>
  
  <div id="auth-container">
    <button id="google-login" class="login-btn" style="display: none;">
      <span class="btn-icon">🔐</span>
      <span>Google 로그인</span>
    </button>
    <div id="user-info" style="display: none;">
      <div class="welcome-box">
        <span class="welcome-icon">👋</span>
        <p>환영합니다, <span id="user-name"></span>님!</p>
      </div>
    </div>
  </div>
  
  <div id="navigation-buttons" style="display: none;">
    <button id="student-btn" class="main-action-btn">
      <span class="btn-icon">🎯</span>
      <span class="btn-text">인공지능 프로젝트 주제 탐색하기</span>
      <span class="btn-subtitle">문제 발견부터 모델 선택까지</span>
    </button>
    <button id="teacher-btn" class="secondary-btn" style="display: none;">
      <span class="btn-icon">📊</span>
      <span>교사 모니터링</span>
    </button>
    <button id="logout-btn" class="logout-btn">로그아웃</button>
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

