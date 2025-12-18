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
}

// 두 번째 챗봇 초기화
function initChatbot2() {
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
}

// 1단계 데이터를 Firestore에 저장
async function saveStep1Data() {
  if (!currentUser) return;

  try {
    const now = new Date();
    const activityDate = now.toLocaleDateString('ko-KR');
    const activityTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const chatbot1Conversation = chatbot1Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({ role: msg.role, content: msg.content }));
    
    const chatbot2Conversation = chatbot2Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({ role: msg.role, content: msg.content }));
    
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

    console.log('1단계 데이터 저장 완료:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    return null;
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
        <div id="final-problem-display" class="final-problem-display" style="display: none;">
          <div class="problem-label">💡 탐구 문제</div>
          <div id="final-problem-text" class="problem-text"></div>
        </div>
        <button class="home-btn" onclick="window.location.href='index.html'">홈으로</button>
      </div>
      
      <!-- 단계 표시기 -->
      <div class="step-indicator">
        <div class="step-item active" id="step-indicator-1">
          <div class="step-number">1</div>
          <div class="step-label">문제 탐색</div>
        </div>
        <div class="step-line"></div>
        <div class="step-item" id="step-indicator-2">
          <div class="step-number">2</div>
          <div class="step-label">문제 정의</div>
        </div>
        <div class="step-line"></div>
        <div class="step-item" id="step-indicator-3">
          <div class="step-number">3</div>
          <div class="step-label">적합성 검증</div>
        </div>
        <div class="step-line"></div>
        <div class="step-item" id="step-indicator-4">
          <div class="step-number">4</div>
          <div class="step-label">모델 탐색</div>
        </div>
      </div>
      
      <h1 id="page-title">1단계: 문제 탐색</h1>
    </div>
    
    <!-- 1단계 섹션 -->
    <div id="step1-section">
    <div class="activity-intro">
      <h3>무엇이 불편한가?</h3>
      <p class="activity-detail">(1) 최근에 겪은 불편한 상황과 관련하여 주제를 선정하고 싶다면, 첫 번째 챗봇 '💭 문제 상황 탐색하기'의 도움을 받아 문제 상황을 구체화해봅시다.</p>
      <p class="activity-detail">(2) 이미 해결하고 싶은 문제 상황을 알고 있다면, 그 내용을 두 번째 챗봇 '📰 뉴스 기사 분석하기'에 입력해 보세요. 챗봇이 주제 구체화를 도와줄 거예요.</p>
    </div>
      <div class="chatbots-row">
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
        </div>
      
        <!-- 두 번째 챗봇: 뉴스 기사 분석 -->
        <div id="chatbot2-container" class="chatbot-container">
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
        </div>
      </div>
      
      <button onclick="goToStep2()" class="next-step-button">문제 정의하기</button>
    </div>
  </div>
  
  <!-- 2단계: 문제 정의하기 -->
  <div id="step2-section" style="display: none;">
    <button onclick="goBackToStep1()" class="back-button">← 이전 단계로</button>
    
    <div class="activity-intro">
      <h3>who-when/where-why? 어떤 문제가 핵심인가?</h3>
      <p class="activity-detail">[누가] [어떤 상황에서] [어떤 어려움]을 겪고 있는지 정리해보자.</p>
    </div>
    
    <!-- Who-What-Why 활동 -->
    <div id="www-section" class="www-section">
      <form id="www-form" onsubmit="submitWWWForm(event)">
        <div class="form-group">
          <label for="who">1. 누가 (Who)</label>
          <p class="field-description">문제를 겪고 있는 대상은 누구인가요?</p>
          <p class="field-example">예시: 시각 장애를 가진 학생들, 고령의 독거 노인, 바쁜 직장인</p>
          <textarea id="who" rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="when-where">2. 언제/어디서 (When/Where)</label>
          <p class="field-description">어떤 상황에서 이 문제가 발생하나요?</p>
          <p class="field-example">예시: 학교에서 수업을 들을 때, 집에서 혼자 있을 때, 출퇴근 시간에</p>
          <textarea id="when-where" rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="problem">3. 어떤 문제 (Problem)</label>
          <p class="field-description">구체적으로 어떤 어려움을 겪고 있나요?</p>
          <p class="field-example">예시: 교과서의 작은 글씨를 읽기 어려움, 응급 상황 시 도움을 요청하기 힘듦, 효율적인 경로를 찾기 어려움</p>
          <textarea id="problem" rows="4" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="final-problem">4. 최종 문제 정의 (Problem)</label>
          <p class="field-description">위 내용을 종합하여 해결하고자 하는 문제를 한 문장으로 정의해보세요.</p>
          <p class="field-example">예시: 시각 장애 학생들이 학교에서 수업 자료의 작은 글씨를 읽기 어려운 문제</p>
          <textarea id="final-problem" rows="4" required></textarea>
        </div>
        
        <button type="submit" class="submit-button">제출 및 다음 단계로 이동</button>
      </form>
    </div>
  </div>
  
  <!-- 3단계: AI 문제 적합성 검증하기 -->
  <div id="step3-section" style="display: none;">
    <button onclick="goBackToStep2()" class="back-button">← 이전 단계로</button>
    
    <div class="activity-intro">
      <h3>이 문제가 인공지능을 활용하여 해결할 수 있는 문제인가?</h3>
      <p class="activity-detail">정의한 문제가 AI로 해결하기에 적합한지 스스로 점검해봅시다.</p>
    </div>
    
    <div class="checklist-section">
      <h3>AI 적합성 체크리스트</h3>
      <p class="checklist-intro">아래 항목들을 확인하며 정의한 문제를 검토해보세요.</p>
      
      <div class="checklist-container">
        <div class="checklist-item">
          <input type="checkbox" id="check1" onchange="updateChecklistProgress()">
          <label for="check1">
            <strong>데이터 수집 가능성:</strong> 문제 해결에 필요한 데이터를 수집할 수 있나요?
          </label>
        </div>
        
        <div class="checklist-item">
          <input type="checkbox" id="check2" onchange="updateChecklistProgress()">
          <label for="check2">
            <strong>패턴 존재 여부:</strong> 데이터에서 반복되는 패턴이나 규칙을 찾을 수 있나요?
          </label>
        </div>
        
        <div class="checklist-item">
          <input type="checkbox" id="check3" onchange="updateChecklistProgress()">
          <label for="check3">
            <strong>명확한 목표:</strong> AI가 무엇을 예측하거나 분류해야 하는지 명확한가요?
          </label>
        </div>
        
        <div class="checklist-item">
          <input type="checkbox" id="check4" onchange="updateChecklistProgress()">
          <label for="check4">
            <strong>자동화 필요성:</strong> 사람이 일일이 판단하기 어렵거나 시간이 오래 걸리는 작업인가요?
          </label>
        </div>
        
        <div class="checklist-item">
          <input type="checkbox" id="check5" onchange="updateChecklistProgress()">
          <label for="check5">
            <strong>윤리적 고려:</strong> AI 사용이 윤리적으로 적절하며, 사람에게 해를 끼치지 않나요?
          </label>
        </div>
      </div>
      
      <div class="progress-message" id="progress-message"></div>
      
      <button onclick="goToStep4()" class="next-step-button" id="step3-next-btn" disabled>다음 단계로</button>
    </div>
  </div>
  
  <!-- 4단계: AI 모델 선정하기 -->
  <div id="step4-section" style="display: none;">
    <button onclick="goBackToStep3()" class="back-button">← 이전 단계로</button>
    
    <div class="activity-intro">
      <h3>가장 적합한 AI 모델은 무엇일까?</h3>
      <p class="activity-detail">내가 정의한 문제를 해결하기 위해 가장 적합한 AI 모델을 선택해봅시다.</p>
      <p class="activity-detail">수업 시간에 배운 모델 중 하나를 선정해보고 그 이유를 작성해 보세요.</p>
    </div>
    
    <div class="model-selection-section">
      <h3>학습한 AI 모델</h3>
      <p class="model-intro">수업 시간에 학습한 모델 중에서 정의한 문제에 가장 적합한 모델을 선택하세요.</p>
      
      <form id="model-form" onsubmit="submitModelSelection(event)">
        <div class="form-group">
          <label for="selected-model">선택한 AI 모델</label>
          <select id="selected-model" required>
            <option value="">모델을 선택하세요</option>
            <option value="선형 회귀">선형 회귀 (Linear Regression)</option>
            <option value="다항 회귀">다항 회귀 (Polynomial Regression)</option>
            <option value="다중 회귀">다중 회귀 (Multiple Regression)</option>
            <option value="로지스틱 회귀">로지스틱 회귀 (Logistic Regression)</option>
            <option value="KNN">KNN (K-Nearest Neighbors)</option>
            <option value="의사결정트리">의사결정트리 (Decision Tree)</option>
            <option value="랜덤 포레스트">랜덤 포레스트 (Random Forest)</option>
            <option value="CNN">CNN (Convolutional Neural Network)</option>
          </select>
        </div>
        
        <div class="form-group model-reason-group">
          <label for="model-reason">이 모델을 선택한 이유</label>
          <p class="field-description">왜 이 모델이 정의한 문제를 해결하는 데 적합하다고 생각하나요?</p>
          <p class="field-description">가장 적합한 모델을 찾지 못했다면, 그 이유는 무엇인가요?</p>
          <p class="field-example">예시: 이미지 데이터를 처리해야 하므로 CNN이 적합하다고 생각합니다. / 분류 문제이고 여러 특성을 고려해야 하므로 랜덤 포레스트가 적합합니다.</p>
          <textarea id="model-reason" class="model-reason-textarea" rows="10" placeholder="선택한 모델이 문제 해결에 적합한 이유를 자세히 작성해주세요..." required></textarea>
          <div class="textarea-helper">
            <span class="helper-icon">💡</span>
            <span class="helper-text">모델의 특징과 문제의 특성을 연결하여 작성하면 좋습니다.</span>
          </div>
        </div>
        
        <button type="submit" class="submit-button">최종 제출</button>
      </form>
    </div>
  </div>
`;

// 2단계로 이동 (1단계 데이터 저장)
async function goToStep2() {
  if (!currentUser) {
    alert('로그인 정보를 확인할 수 없습니다.');
    return;
  }

  try {
    // 현재 날짜와 시간 가져오기
    const now = new Date();
    const activityDate = now.toLocaleDateString('ko-KR'); // 예: 2025. 12. 17.
    const activityTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`; // 예: 14:35
    
    // Chatbot1 대화 내역 (system 메시지 제외)
    const chatbot1Conversation = chatbot1Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Chatbot2 대화 내역 (system 메시지 제외)
    const chatbot2Conversation = chatbot2Messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Firestore에 데이터 저장
    const docRef = await addDoc(collection(db, 'step1Activities'), {
      userName: currentUser.displayName || '익명',
      userEmail: currentUser.email,
      activityDate: activityDate,
      activityTime: activityTime,
      chatbot1Conversation: chatbot1Conversation,
      chatbot2Conversation: chatbot2Conversation,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    
    console.log('1단계 데이터 저장 완료:', docRef.id);
    
    // 2단계로 이동 및 제목 변경
    updateStepIndicator(2);
    document.getElementById('page-title').textContent = '2단계: 문제 정의하기';
    document.getElementById('step1-section').style.display = 'none';
    document.getElementById('step2-section').style.display = 'block';
    window.scrollTo(0, 0);
    
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    alert('데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

// Who-What-Why 폼 제출
function submitWWWForm(event) {
  event.preventDefault();
  
  const who = document.getElementById('who').value;
  const whenWhere = document.getElementById('when-where').value;
  const problem = document.getElementById('problem').value;
  const finalProblem = document.getElementById('final-problem').value;
  
  // Firestore에 데이터 저장
  saveStep2Data(who, whenWhere, problem, finalProblem);
  
  // 최종 문제를 헤더에 표시
  const finalProblemDisplay = document.getElementById('final-problem-display');
  const finalProblemText = document.getElementById('final-problem-text');
  finalProblemText.textContent = finalProblem;
  finalProblemDisplay.style.display = 'flex';
  
  // 3단계로 이동
  updateStepIndicator(3);
  document.getElementById('page-title').textContent = '3단계: AI 문제 적합성 검증하기';
  document.getElementById('step2-section').style.display = 'none';
  document.getElementById('step3-section').style.display = 'block';
  window.scrollTo(0, 0);
}

// 체크리스트 진행도 업데이트
function updateChecklistProgress() {
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  const checked = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
  const total = checkboxes.length;
  const count = checked.length;
  
  const progressMessage = document.getElementById('progress-message');
  const nextBtn = document.getElementById('step3-next-btn');
  
  if (count === total) {
    progressMessage.textContent = '✅ 모든 항목을 확인했습니다! 다음 단계로 진행하세요.';
    progressMessage.style.color = '#2d7a5f';
    nextBtn.disabled = false;
  } else {
    progressMessage.textContent = `${count}/${total} 항목 확인 완료`;
    progressMessage.style.color = '#5a9279';
    nextBtn.disabled = true;
  }
}

// 4단계로 이동
function goToStep4() {
  updateStepIndicator(4);
  document.getElementById('page-title').textContent = '4단계: AI 모델 탐색하기';
  document.getElementById('step3-section').style.display = 'none';
  document.getElementById('step4-section').style.display = 'block';
  window.scrollTo(0, 0);
}

// 이전 단계로 돌아가기 함수들
function goBackToStep1() {
  updateStepIndicator(1);
  document.getElementById('page-title').textContent = '1단계: 문제 탐색';
  document.getElementById('step2-section').style.display = 'none';
  document.getElementById('step1-section').style.display = 'block';
  window.scrollTo(0, 0);
}

function goBackToStep2() {
  updateStepIndicator(2);
  document.getElementById('page-title').textContent = '2단계: 문제 정의하기';
  document.getElementById('step3-section').style.display = 'none';
  document.getElementById('step2-section').style.display = 'block';
  window.scrollTo(0, 0);
}

function goBackToStep3() {
  updateStepIndicator(3);
  document.getElementById('page-title').textContent = '3단계: AI 문제 적합성 검증하기';
  document.getElementById('step4-section').style.display = 'none';
  document.getElementById('step3-section').style.display = 'block';
  window.scrollTo(0, 0);
}

// 단계 표시기 업데이트
function updateStepIndicator(currentStep) {
  // 모든 단계 표시기 초기화
  for (let i = 1; i <= 4; i++) {
    const stepItem = document.getElementById(`step-indicator-${i}`);
    if (stepItem) {
      stepItem.classList.remove('active', 'completed');
      if (i < currentStep) {
        stepItem.classList.add('completed');
      } else if (i === currentStep) {
        stepItem.classList.add('active');
      }
    }
  }
}

// 모델 선택 제출
async function submitModelSelection(event) {
  event.preventDefault();
  
  const selectedModel = document.getElementById('selected-model').value;
  const modelReason = document.getElementById('model-reason').value;
  
  // Firestore에 데이터 저장
  await saveStep4Data(selectedModel, modelReason);
  
  alert('모든 활동이 완료되었습니다! 수고하셨습니다.');
  
  // 홈으로 이동 또는 완료 페이지 표시
  if (confirm('홈 페이지로 돌아가시겠습니까?')) {
    window.location.href = 'index.html';
  }
}

// 2단계 데이터를 Firestore에 저장
async function saveStep2Data(who, whenWhere, problem, finalProblem) {
  if (!currentUser) return;

  try {
    const now = new Date();
    const activityDate = now.toLocaleDateString('ko-KR');
    const activityTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const docRef = await addDoc(collection(db, 'step2Activities'), {
      userName: currentUser.displayName || '익명',
      userEmail: currentUser.email,
      activityDate: activityDate,
      activityTime: activityTime,
      who: who,
      whenWhere: whenWhere,
      problem: problem,
      finalProblem: finalProblem,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    
    console.log('2단계 데이터 저장 완료:', docRef.id);
  } catch (error) {
    console.error('2단계 데이터 저장 오류:', error);
  }
}

// 4단계 데이터를 Firestore에 저장
async function saveStep4Data(selectedModel, modelReason) {
  if (!currentUser) return;

  try {
    const now = new Date();
    const activityDate = now.toLocaleDateString('ko-KR');
    const activityTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const docRef = await addDoc(collection(db, 'step4Activities'), {
      userName: currentUser.displayName || '익명',
      userEmail: currentUser.email,
      activityDate: activityDate,
      activityTime: activityTime,
      selectedModel: selectedModel,
      modelReason: modelReason,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    
    console.log('4단계 데이터 저장 완료:', docRef.id);
  } catch (error) {
    console.error('4단계 데이터 저장 오류:', error);
  }
}

// 전역 함수 등록
window.handleChatbot1Input = handleChatbot1Input;
window.handleChatbot2Input = handleChatbot2Input;
window.submitWWWForm = submitWWWForm;
window.saveStep1Data = saveStep1Data;
window.goToStep2 = goToStep2;
window.updateChecklistProgress = updateChecklistProgress;
window.goToStep4 = goToStep4;
window.submitModelSelection = submitModelSelection;
window.goBackToStep1 = goBackToStep1;
window.goBackToStep2 = goBackToStep2;
window.goBackToStep3 = goBackToStep3;
window.updateStepIndicator = updateStepIndicator;

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

// 페이지 로드 시 두 챗봇 모두 초기화
initChatbot1();
initChatbot2();
