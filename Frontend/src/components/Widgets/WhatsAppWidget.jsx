import React, { useState } from "react";
import "./WhatsAppWidget.css";

const WHATSAPP_PHONE = "919876543210";

const QUICK_QUESTIONS = [
  "Hello ZWMStore! I need assistance with product sizing.",
  "Hello ZWMStore! Is Cash on Delivery (COD) available for my area?",
  "Hello ZWMStore! What are the delivery timelines across India?",
  "Hello ZWMStore! How can I track my order status?"
];

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = (textToSend) => {
    const text = textToSend || message || "Hello HooDee Daddy Support, I would like to inquire about your products.";
    if (!text.trim()) return;
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setMessage("");
    setIsOpen(false);
  };

  return (
    <div className="whatsapp-widget-wrapper">
      {/* Pop-up Chat Window */}
      {isOpen && (
        <div className="whatsapp-popup">
          <div className="whatsapp-popup-header">
            <div className="whatsapp-agent">
              <div className="agent-avatar">
                <span>ZWM</span>
                <span className="online-dot" />
              </div>
              <div className="agent-info">
                <span className="agent-name">HooDee Daddy Support</span>
                <span className="agent-status">Online • Indian Standard Time</span>
              </div>
            </div>
            <button
              className="whatsapp-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
            >
              ✕
            </button>
          </div>

          <div className="whatsapp-popup-body">
            <div className="chat-bubble">
              <p>
                Hi! 👋 Welcome to HooDee Daddy Customer Support. How can we help you today with product sizing, COD availability, delivery, or order tracking?
              </p>
              <span className="chat-time">Just now</span>
            </div>

            <div className="quick-questions-box">
              <span className="quick-label">Tap a topic to start:</span>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="quick-q-btn"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="whatsapp-popup-footer">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="whatsapp-input"
            />
            <button
              className="whatsapp-send-btn"
              onClick={() => handleSend()}
              aria-label="Send WhatsApp message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Launcher Button */}
      <button
        className={`whatsapp-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with Concierge on WhatsApp"
        title="Chat with Concierge"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </button>
    </div>
  );
}
