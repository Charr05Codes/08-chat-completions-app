// Get references to the DOM elements
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const responseContainer = document.getElementById('response');

// Use a new key so older conversations with outdated instructions do not affect replies
const storageKey = 'wanderBotConversationV3';
const systemMessage = {
  role: 'system',
  content: `You are a friendly Budget Travel Planner, specializing in cost-conscious travel advice. You help users find cheap flights, budget-friendly accommodations, affordable itineraries, and low-cost activities in their chosen destination.

  You can remember and use details the user shares, such as their name, during this conversation. Do not claim that you are unable to remember information when it appears in the conversation history. This memory only lasts while the conversation history is available; do not imply that you will remember details in a future conversation.`
};

// Load the conversation from the browser, or start with the system message
const savedConversation = localStorage.getItem(storageKey);
const conversationHistory = savedConversation
  ? JSON.parse(savedConversation)
  : [systemMessage];

// Make sure saved conversations use the latest system instructions
if (conversationHistory[0]?.role === 'system') {
  conversationHistory[0] = systemMessage;
} else {
  conversationHistory.unshift(systemMessage);
}

function saveConversation() {
  localStorage.setItem(storageKey, JSON.stringify(conversationHistory));
}

saveConversation();

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userMessage = userInput.value.trim();

  if (!userMessage) {
    responseContainer.textContent = 'Please enter a question first.';
    return;
  }

  // Clear the input after the user submits the query
  userInput.value = '';

  // Add the new user message to the conversation history
  conversationHistory.push({ role: 'user', content: userMessage });
  saveConversation();

  // Send a POST request to the OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', // We are POST-ing data to the API
    headers: {
      'Content-Type': 'application/json', // Set the content type to JSON
      'Authorization': `Bearer ${apiKey}` // Include the API key for authorization
    },
    // Send the model and the complete conversation history
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: conversationHistory
    })
  });

  if (!response.ok) {
    // Remove the message so a failed request is not included in the next request
    conversationHistory.pop();
    saveConversation();
    responseContainer.textContent = 'Sorry, something went wrong. Please try again.';
    return;
  }

  // Parse and store the response data
  const result = await response.json();

  // Display the response on the page
  const assistantMessage = result.choices[0].message;
  responseContainer.textContent = assistantMessage.content;

  // Save the AI response for the next request
  conversationHistory.push(assistantMessage);
  saveConversation();
});