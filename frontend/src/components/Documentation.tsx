import React, { useState } from 'react';
import './Documentation.css';
import { BookOpen, Map, Settings, Layout, Server, Code, Sparkles, X, CheckSquare, MessageSquare, Clock } from 'lucide-react';

const Demos: Record<string, any> = {
  dashboard: {
    title: 'Dashboard Demo',
    description: 'The dashboard gives you a quick overview of your upcoming trip.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-countdown"><Clock size={16}/> 15 Days Until Goa Trip</div>
        <div className="demo-ai-bar"><MessageSquare size={16}/> Ask AI anything about Goa...</div>
      </div>
    )
  },
  plantrip: {
    title: 'Plan Trip Demo',
    description: 'Create checklists and organize items by category.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-check-item"><CheckSquare size={16} color="var(--accent)"/> Beach Towel</div>
        <div className="demo-check-item"><CheckSquare size={16} color="var(--accent)"/> Sunscreen</div>
        <div className="demo-check-item"><div className="demo-empty-check"></div> Sunglasses</div>
      </div>
    )
  },
  laundry: {
    title: 'Laundry Tracker Demo',
    description: 'Keep track of dirty clothes after the trip.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-laundry-item"><span>T-Shirts (3)</span> <span className="demo-badge bad-red">Needs Wash</span></div>
        <div className="demo-laundry-item"><span>Jeans (1)</span> <span className="demo-badge bad-green">Washing</span></div>
      </div>
    )
  },
  ai: {
    title: 'AI Assistant Demo',
    description: 'Ask questions and get intelligent travel suggestions.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-chat-user">What should I pack for a 5-day winter trip to Manali?</div>
        <div className="demo-chat-ai">For Manali in winter, pack heavy woolens, thermal innerwear, a windproof jacket, and snow boots. Don't forget lip balm!</div>
      </div>
    )
  }
};

const Documentation = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <div className="docs-container">
      <div className="docs-header">
        <BookOpen className="docs-icon" size={40} />
        <h1>Project Guide - Home Trip Mode</h1>
        <p>A simple User Guide and Developer Guide for the Home Trip Mode app</p>
      </div>

      <div className="docs-content">
        <section className="docs-section">
          <h2><Layout className="section-icon" /> How does this project work?</h2>
          <p>
            <strong>Home Trip Mode</strong> is a smart web application that helps you plan your trips, pack your bags, 
            and track your laundry after the trip.
          </p>
          <div className="docs-features">
            <div className="feature-card clickable" onClick={() => setActiveDemo('dashboard')}>
              <h3>Dashboard</h3>
              <p>This is the main screen of the app. Here you can see the countdown to your next trip, smart travel tips, and an AI bar to ask any travel-related questions.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('plantrip')}>
              <h3>Plan Trip (Trip Planner)</h3>
              <p>Here you can add new trips and create packing checklists. You can add items based on categories (like Clothing, Electronics) and tick them off as you pack.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('laundry')}>
              <h3>Laundry Tracker</h3>
              <p>After your trip, you can use this page to keep track of the clothes that need washing and update their washing status easily.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2><Sparkles className="section-icon" /> AI Assistant Use Cases</h2>
          <p>The built-in AI Assistant on the Dashboard can help you with various travel tasks. Try asking it things like:</p>
          <div className="docs-features">
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Plan an Itinerary</h3>
              <p>Ask: <em>"Create a 3-day itinerary for a family trip to Munnar focusing on relaxing activities."</em></p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Packing Suggestions</h3>
              <p>Ask: <em>"What should I pack for a 5-day winter trip to Manali?"</em></p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Weather & Tips</h3>
              <p>Ask: <em>"What is the best time to visit Goa and what are some local safety tips?"</em></p>
              <div className="card-hint">Click to see demo</div>
            </div>
          </div>
        </section>
      </div>

      {/* Demo Modal */}
      {activeDemo && Demos[activeDemo] && (
        <div className="demo-modal-overlay" onClick={() => setActiveDemo(null)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="demo-close-btn" onClick={() => setActiveDemo(null)}>
              <X size={24} />
            </button>
            <div className="demo-modal-header">
              <h2>{Demos[activeDemo].title}</h2>
              <p>{Demos[activeDemo].description}</p>
            </div>
            <div className="demo-modal-body">
              {Demos[activeDemo].mockup}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentation;
