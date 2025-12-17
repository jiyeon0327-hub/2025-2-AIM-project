import './style.css'
import { auth, db } from './firebaseConfig.js'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// OpenAI API Key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// 대화 히스토리
let chatbot1Messages = [];
let chatbot2Messages = [];
let chatbot1Count = 0;

// 현재 단계
let currentStep = 1;

// 사용자 정보
let currentUser = null;

// OpenAI API 호출 함수
async function callOpenAI(messages, isFirstBot = true) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    return '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.';
  }
}

// 첫 번째 챗봇 메시지 추가
function addChatbot1Message(message, isUser = false) {
  const chatContainer = document.getElementById('chatbot1-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = message;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 두 번째 챗봇 메시지 추가
function addChatbot2Message(message, isUser = false) {
  const chatContainer = document.getElementById('chatbot2-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = message;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 첫 번째 챗봇 초기화
function initChatbot1() {
  chatbot1Messages = [
    {
      role: 'system',
      content: `당신은 학생들이 일상에서 문제 상황을 발견할 수 있도록 돕는 친절한 가이드입니다. 
학생들이 학교, 일상생활, 사회에서 불편하거나 비효율적이라고 느끼는 상황을 스스로 떠올릴 수 있도록 질문을 통해 유도하세요.
직접적으로 문제나 주제를 추천하지 말고, 학생이 스스로 생각할 수 있도록 개방형 질문을 해주세요.
예시 질문:
- "최근에 학교에서 불편하다고 느낀 상황이 있나요?"
- "일상생활에서 '이게 더 편리하면 좋겠다'고 생각한 적이 있나요?"
- "그 상황에서 어떤 점이 가장 불편했나요?"
- "비슷한 문제를 겪는 사람들이 또 있을까요?"`
    }
  ];
  
  const initialMessage = "안녕하세요! 함께 해결하고 싶은 문제를 찾아볼까요? 최근에 학교나 일상생활에서 불편하다고 느낀 상황이 있나요?";
  chatbot1Messages.push({ role: 'assistant', content: initialMessage });
  addChatbot1Message(initialMessage);
}

// 첫 번째 챗봇 사용자 입력 처리
async function handleChatbot1Input() {
  const input = document.getElementById('chatbot1-input');
  const userMessage = input.value.trim();
  
  if (!userMessage) return;
  
  // 사용자 메시지 표시
  addChatbot1Message(userMessage, true);
  chatbot1Messages.push({ role: 'user', content: userMessage });
  chatbot1Count++;
  
  input.value = '';
  input.disabled = true;
  
  // 로딩 표시
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot-message loading';
  loadingDiv.textContent = '답변을 생성중입니다...';
  loadingDiv.id = 'loading-message';
  document.getElementById('chatbot1-messages').appendChild(loadingDiv);
  
  // AI 응답 받기
  const response = await callOpenAI(chatbot1Messages, true);
  
  // 로딩 제거
  document.getElementById('loading-message').remove();
  
  // AI 메시지 표시
  addChatbot1Message(response);
  chatbot1Messages.push({ role: 'assistant', content: response });
  
  input.disabled = false;
  input.focus();
  
  // 3회 이상 대화 후 버튼 활성화
  if (chatbot1Count >= 3) {
    document.getElementById('show-newslink-btn').disabled = false;
  }
}

// 뉴스 링크 입력 섹션 표시
function showNewsLinkSection() {
  document.getElementById('chatbot1-container').style.display = 'none';
  document.getElementById('chatbot2-container').style.display = 'block';
  
  // 두 번째 챗봇 초기화
  chatbot2Messages = [
    {
      role: 'system',
      content: `당신은 뉴스 기사를 분석하고 해결할 문제를 도출하는 전문가입니다.
사용자가 제공한 뉴스 링크나 내용을 요약하고, 그 안에서 해결할 수 있는 구체적인 문제 상황들을 3-5개 추천해주세요.
각 문제 상황은 AI나 기술로 해결 가능성이 있는 것들로 제안하세요.`
    }
  ];
  
  const initialMessage = "발견하신 문제 상황과 관련된 뉴스 링크나 기사 내용을 입력해주세요. 분석하여 해결할 수 있는 문제 상황을 추천해드리겠습니다.";
  chatbot2Messages.push({ role: 'assistant', content: initialMessage });
  addChatbot2Message(initialMessage);
}

// 두 번째 챗봇 사용자 입력 처리
async function handleChatbot2Input() {
  const input = document.getElementById('chatbot2-input');
  const userMessage = input.value.trim();
  
  if (!userMessage) return;
  
  // 사용자 메시지 표시
  addChatbot2Message(userMessage, true);
  chatbot2Messages.push({ role: 'user', content: userMessage });
  
  input.value = '';
  input.disabled = true;
  
  // 로딩 표시
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot-message loading';
  loadingDiv.textContent = '분석중입니다...';
  loadingDiv.id = 'loading-message-2';
  document.getElementById('chatbot2-messages').appendChild(loadingDiv);
  
  // AI 응답 받기
  const response = await callOpenAI(chatbot2Messages, false);
  
  // 로딩 제거
  document.getElementById('loading-message-2').remove();
  
  // AI 메시지 표시
  addChatbot2Message(response);
  chatbot2Messages.push({ role: 'assistant', content: response });
  
  input.disabled = false;
  input.focus();
  
  // 문제 정의하기 버튼 활성화
  document.getElementById('next-step-btn').disabled = false;
}

// 다음 단계로 이동
async function goToNextStep() {
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    window.location.href = 'index.html';
    return;
  }

  try {
    // 현재 날짜와 시간 가져오기
    const now = new Date();
    const activityDate = now.toLocaleDateString('ko-KR'); // 예: 2025. 12. 17.
    const activityTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`; // 예: 14:30
    
    // 시스템 메시지를 제외한 대화 내역 필터링
    const chatbot1Conversation = chatbot1Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    const chatbot2Conversation = chatbot2Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Firestore에 데이터 저장
    const docRef = await addDoc(collection(db, 'problemDefinitions'), {
      userName: currentUser.displayName || '익명',
      userEmail: currentUser.email,
      chatbot1Conversation: chatbot1Conversation,
      chatbot2Conversation: chatbot2Conversation,
      activityDate: activityDate,
      activityTime: activityTime,
      timestamp: serverTimestamp(),
      step: 1
    });

    console.log('문제 정의 데이터 저장 완료:', docRef.id);
    alert('문제 정의 데이터가 저장되었습니다. 2단계로 이동합니다.');
    
    // TODO: 실제로는 다음 페이지로 이동하거나 단계를 변경
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
  }
}

// 초기 UI 렌더링
document.querySelector('#app').innerHTML = `
  <div class="student-container">
    <div class="header">
      <div class="user-info-header">
        <div id="user-display" class="user-display">
          <div>
            <span id="user-name-display">로그인 중...</span>
            <span id="user-email-display"></span>
          </div>
        </div>
        <button class="home-btn" onclick="window.location.href='index.html'">홈으로</button>
      </div>
      <h1>1단계: 문제 탐색</h1>
    </div>
    
    <!-- 첫 번째 챗봇: 문제 탐색 -->
    <div id="chatbot1-container" class="chatbot-container">
      <h2>💭 문제 상황 탐색하기</h2>
      <p class="description">최근에 불편하다고 느꼈던 상황을 떠올려보세요. 챗봇과 대화하며 생각을 정리해보세요.</p>
      
      <div class="chat-box">
        <div id="chatbot1-messages" class="chat-messages"></div>
        <div class="chat-input-container">
          <input 
            type="text" 
            id="chatbot1-input" 
            placeholder="메시지를 입력하세요..." 
            onkeypress="if(event.key==='Enter') handleChatbot1Input()"
          />
          <button onclick="handleChatbot1Input()">전송</button>
        </div>
      </div>
      
      <button 
        id="show-newslink-btn" 
        class="step-btn" 
        onclick="showNewsLinkSection()"
        disabled
      >
        문제 상황 뉴스 링크 입력하기
      </button>
    </div>
    
    <!-- 두 번째 챗봇: 뉴스 링크 분석 -->
    <div id="chatbot2-container" class="chatbot-container" style="display: none;">
      <h2>📰 뉴스 기사 분석하기</h2>
      <p class="description">발견한 문제와 관련된 뉴스 링크나 기사 내용을 입력해주세요.</p>
      
      <div class="chat-box">
        <div id="chatbot2-messages" class="chat-messages"></div>
        <div class="chat-input-container">
          <input 
            type="text" 
            id="chatbot2-input" 
            placeholder="뉴스 링크 또는 기사 내용을 입력하세요..." 
            onkeypress="if(event.key==='Enter') handleChatbot2Input()"
          />
          <button onclick="handleChatbot2Input()">전송</button>
        </div>
      </div>
      
      <button 
        id="next-step-btn" 
        class="step-btn" 
        onclick="goToNextStep()"
        disabled
      >
        문제 정의하기 (2단계로 이동)
      </button>
    </div>
  </div>
`;

// 전역 함수 등록
window.handleChatbot1Input = handleChatbot1Input;
window.handleChatbot2Input = handleChatbot2Input;
window.showNewsLinkSection = showNewsLinkSection;
window.goToNextStep = goToNextStep;

// 사용자 인증 상태 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    
    // 사용자 정보 표시
    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');
    
    if (userNameDisplay) {
      userNameDisplay.textContent = user.displayName || '사용자';
    }
    if (userEmailDisplay) {
      userEmailDisplay.textContent = user.email;
    }
    
    console.log('로그인된 사용자:', user.email);
  } else {
    // 로그인하지 않은 경우 홈으로 리다이렉트
    alert('로그인이 필요합니다.');
    window.location.href = 'index.html';
  }
});

// 페이지 로드 시 첫 번째 챗봇 초기화
initChatbot1();
