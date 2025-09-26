import React, { useState, useEffect } from 'react';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  fact: string;
}

const questions: TriviaQuestion[] = [
  {
    id: 1,
    question: "What percentage of Earth's soil is considered healthy and productive?",
    options: ["5%", "15%", "30%", "50%"],
    correct: 0,
    fact: "Only 5% of Earth's soil is healthy. Organic amendments are crucial for soil restoration."
  },
  {
    id: 2,
    question: "Which amendment improves both drainage and water retention?",
    options: ["Sand", "Clay", "Compost", "Gravel"],
    correct: 2,
    fact: "Compost improves soil structure, allowing better drainage while retaining moisture."
  },
  {
    id: 3,
    question: "How much carbon can healthy soil store per acre?",
    options: ["1 ton", "5 tons", "10 tons", "20 tons"],
    correct: 3,
    fact: "Healthy soil can store 20+ tons of carbon per acre, helping combat climate change."
  },
  {
    id: 4,
    question: "What is the ideal soil pH for most plants?",
    options: ["4.5-5.5", "6.0-7.0", "7.5-8.5", "9.0-10.0"],
    correct: 1,
    fact: "Most plants thrive in slightly acidic to neutral soil (pH 6.0-7.0)."
  },
  {
    id: 5,
    question: "Which amendment adds beneficial microorganisms to soil?",
    options: ["Perlite", "Vermiculite", "Worm Castings", "Pumice"],
    correct: 2,
    fact: "Worm castings contain millions of beneficial microorganisms that improve soil health."
  }
];

const TriviaGame: React.FC = () => {
  const [stage, setStage] = useState<'landing' | 'trivia' | 'interests' | 'success'>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showFact, setShowFact] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [nameOnly, setNameOnly] = useState('');
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Load leaderboard from localStorage on component mount
  useEffect(() => {
    const loadLeaderboard = () => {
      try {
        const stored = localStorage.getItem('triviaLeaderboard');
        if (stored) {
          const allEntries = JSON.parse(stored);
          
          // Filter for today's entries only
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayEntries = allEntries
            .filter((entry: any) => {
              const entryDate = new Date(entry.timestamp);
              entryDate.setHours(0, 0, 0, 0);
              return entryDate.getTime() === today.getTime();
            })
            .sort((a: any, b: any) => {
              if (b.score !== a.score) return b.score - a.score;
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            })
            .slice(0, 10);
          
          setLeaderboard(todayEntries);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      }
    };
    
    loadLeaderboard();
  }, []);

  const updateLeaderboard = (name: string, score: number) => {
    try {
      const stored = localStorage.getItem('triviaLeaderboard');
      const allEntries = stored ? JSON.parse(stored) : [];
      
      // Add new entry
      allEntries.push({
        name,
        score,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 entries
      if (allEntries.length > 100) {
        allEntries.splice(0, allEntries.length - 100);
      }
      
      localStorage.setItem('triviaLeaderboard', JSON.stringify(allEntries));
      
      // Update current leaderboard display
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEntries = allEntries
        .filter((entry: any) => {
          const entryDate = new Date(entry.timestamp);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        })
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        })
        .slice(0, 10);
      
      setLeaderboard(todayEntries);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameOnly) {
      setFormData({ ...formData, name: nameOnly });
      setStage('trivia');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === questions[currentQuestion].correct;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowFact(true);
    setTimeout(() => {
      setShowFact(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setStage('interests');
      }
    }, 2500);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    // Update local leaderboard immediately
    updateLeaderboard(formData.name, score);
    
    // Send to webhook (fire and forget)
    try {
      const webhookUrl = 'https://hook.us1.make.com/g9vcrnuynwozkrtont4ptfte1pp89bno';
      const submittedAt = new Date().toISOString();
      
      // Create simplified webhook payload to avoid parsing issues
      const webhookPayload = {
        event: 'trivia_lead_captured',
        timestamp: submittedAt,
        name: formData.name || 'Unknown',
        email: formData.email || '',
        interests: selectedInterests.join(', '),
        interestsList: selectedInterests,
        score: score,
        maxScore: 5,
        answers: selectedAnswers,
        submittedAt: submittedAt,
        eventName: 'Trade Show 2025',
        prizeCode: 'SOIL20',
        leadQuality: score >= 4 ? 'hot' : score >= 3 ? 'warm' : 'cold',
        engagementLevel: selectedInterests.length > 3 ? 'high' : selectedInterests.length > 1 ? 'medium' : 'low',
        scoreBadge: score === 5 ? 'Perfect Score!' : score >= 4 ? 'High Score!' : score >= 3 ? 'Good Score' : 'Learning'
      };
      
      // Send webhook with proper error handling
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      }).then(response => {
        console.log('Webhook sent successfully:', response.status);
      }).catch(err => {
        console.log('Webhook error (non-blocking):', err);
      });
    } catch (error) {
      console.log('Webhook setup error:', error);
    }
    
    setStage('success');
  };

  if (stage === 'landing') {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/hands-holding-soil.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl px-8 text-center mx-auto">
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight mx-auto max-w-4xl">
            Test Your<br />
            <span className="text-green-400">Soil Knowledge</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-200 mb-12">
            Answer 5 expert questions.
          </p>
          
          {/* Name Input with Leaderboard */}
          <form onSubmit={handleStart} className="max-w-lg mx-auto mb-12">
            {/* High Score Leaderboard */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <p className="text-yellow-400 font-bold text-sm mb-3 text-center">🏆 TODAY'S LEADERBOARD 🏆</p>
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-white/90">
                      <span className="flex items-center gap-2">
                        <span className={
                          index === 0 ? "text-yellow-400" : 
                          index === 1 ? "text-gray-300" : 
                          "text-orange-400"
                        }>
                          {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                        </span>
                        {entry.name}
                      </span>
                      <span className="font-bold">
                        {entry.score}/5 {entry.score === 5 && '⭐'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/70 text-center py-4">
                  Be the first to play today!
                </p>
              )}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your name"
                value={nameOnly}
                onChange={(e) => setNameOnly(e.target.value)}
                className="w-full px-8 py-7 text-2xl text-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-400/50 placeholder-gray-400"
                required
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white py-7 text-2xl font-bold rounded-2xl shadow-2xl transform transition-all hover:scale-[1.02] hover:shadow-green-500/25"
            >
              Start Quiz →
            </button>
            
            <p className="text-center mt-4 text-white/70 text-sm">
              Test your knowledge and join our soil health community!
            </p>
          </form>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" />
              </svg>
              <span className="font-medium">2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Expert verified</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">500+ pros tested</span>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <p className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-16 max-w-2xl w-full text-center">
          {score === 5 ? (
            <>
              <div className="text-8xl mb-6">🏆</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Perfect Score, {formData.name}!
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                You're a soil expert!
              </p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-6">🎉</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Great Job, {formData.name}!
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                You scored {score}/5 - Nice work!
              </p>
            </>
          )}
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-8 mb-8">
            <p className="text-2xl font-bold text-gray-800 mb-3">
              Welcome to Our Soil Community!
            </p>
            <p className="text-lg text-gray-600">
              You'll receive weekly tips on organic protocols, soil health news, and expert insights
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-sm text-gray-600 mb-2">📧 Check your inbox at:</p>
            <p className="font-medium text-lg">{formData.email}</p>
            <p className="text-sm text-gray-500 mt-2">Your first soil health guide arrives tomorrow!</p>
          </div>
          
          <button
            onClick={() => {
              // Reset everything and go back to start
              setStage('landing');
              setCurrentQuestion(0);
              setScore(0);
              setSelectedAnswers([]);
              setSelectedInterests([]);
              setFormData({ name: '', phone: '', email: '' });
              setNameOnly('');
            }}
            className="bg-gray-200 hover:bg-gray-300 px-8 py-4 rounded-xl text-gray-700 font-medium transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'interests') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-12">
        <div className="max-w-3xl w-full">
          {/* Score Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center text-white">
            <h2 className="text-4xl font-medium mb-2">
              Nice work, {formData.name}!
            </h2>
            <p className="text-2xl">
              You scored <span className="font-bold">{score}/5</span>
            </p>
          </div>

          {/* Contact Collection */}
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-12">
              <h3 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
                Want to Continue<br />Learning About Soil?
              </h3>
              <p className="text-base text-gray-500 max-w-md mx-auto">
                Subscribe to get soil tips and tricks: organic protocols, news and more
              </p>
            </div>

            <div className="space-y-6">
              {/* Email Input */}
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-6 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:shadow-lg transition-all bg-gray-50 focus:bg-white"
                  required
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>

              {/* Interests Section with SVG Icons */}
              <div className="pt-6 border-t">
                <p className="text-sm font-medium text-gray-700 mb-4">What are you growing? (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { 
                      name: 'Vegetables',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c-1.5 0-3 1-3 2.5S10.5 8 12 8s3-2 3-3.5S13.5 2 12 2z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0c-2 0-5 1-5 3s3 3 5 3 5-1 5-3-3-3-5-3z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12c0-1-1-2-2.5-2S2 11 2 12s1 2 2.5 2S7 13 7 12zM17 12c0-1 1-2 2.5-2s2.5 1 2.5 2-1 2-2.5 2-2.5-1-2.5-2z"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Cannabis',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M12 6l-4 4m4-4l4 4M12 10l-6 6m6-6l6 6M12 14l-4 4m4-4l4 4"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Landscaping',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12c0-3.5 2.5-6 5.5-6 1.5 0 3 .5 4 1.5 1-1 2.5-1.5 4-1.5 3 0 5.5 2.5 5.5 6M5 12c0 5.5 7 10 7 10s7-4.5 7-10"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Indoor Plants',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c0-3.5-2-7-2-7s-3 1-3-2c0-2 2-4 5-4s5 2 5 4c0 3-3 2-3 2s-2 3.5-2 7z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Lawn Care',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M5 20v-4m14 4v-4M5 16c0-2 2-4 2-4s2 2 2 4m10 0c0-2-2-4-2-4s-2 2-2 4m-3 0c0-2-2-4-2-4s-2 2-2 4"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Native Plants',
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m0-5c-3 0-5 2-5 5v9h10v-9c0-3-2-5-5-5z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 9c-1-2-3-3-3-3s0 3 2 5m10-2c1-2 3-3 3-3s0 3-2 5"/>
                        </svg>
                      )
                    }
                  ].map(({ name, icon }) => (
                    <button
                      key={name}
                      onClick={() => toggleInterest(name)}
                      className={`group relative overflow-hidden py-5 px-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] ${
                        selectedInterests.includes(name)
                          ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-400 shadow-lg'
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      } border-2`}
                    >
                      {/* Content */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`transition-colors ${
                          selectedInterests.includes(name) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}>
                          {icon}
                        </div>
                        <span className="font-semibold text-sm">{name}</span>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedInterests.includes(name) && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.email}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-2xl font-bold rounded-2xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Subscribe Now →
              </button>

              <p className="text-center text-sm text-gray-500">
                No spam, ever. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Enhanced Progress Bar */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <span className="text-lg font-bold">Question {currentQuestion + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <span className="text-lg font-bold">Score: {score}/{currentQuestion}</span>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-yellow-300 to-white h-full rounded-full transition-all duration-700 ease-out shadow-md"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-16">
          {showFact ? (
            <div className="text-center py-12">
              {/* Animated Result Icon */}
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 animate-bounce ${
                selectedAnswers[currentQuestion] === questions[currentQuestion].correct 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-200' 
                  : 'bg-gradient-to-br from-orange-400 to-red-500 shadow-red-200'
              } shadow-2xl`}>
                <span className="text-6xl">
                  {selectedAnswers[currentQuestion] === questions[currentQuestion].correct ? '✅' : '❌'}
                </span>
              </div>
              
              {/* Result Text */}
              <p className={`text-4xl font-black mb-6 ${
                selectedAnswers[currentQuestion] === questions[currentQuestion].correct
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {selectedAnswers[currentQuestion] === questions[currentQuestion].correct ? 'CORRECT!' : 'OOPS!'}
              </p>
              
              {/* Fact Box */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 max-w-2xl mx-auto border border-green-200">
                <p className="text-xl text-gray-700 font-medium leading-relaxed">
                  <span className="text-2xl mr-2">💡</span>
                  <span className="font-bold">Did you know?</span> {questions[currentQuestion].fact}
                </p>
              </div>
              
              {/* Progress Timer */}
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Next question coming up...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-medium text-center text-gray-900 mb-16">
                {questions[currentQuestion].question}
              </h1>

              <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="group relative p-8 text-xl font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    <span className="relative z-10">{option}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriviaGame;