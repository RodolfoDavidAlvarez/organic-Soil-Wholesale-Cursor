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
  const [formData, setFormData] = useState({ phone: '', email: '' });
  const [phoneOnly, setPhoneOnly] = useState('');
  const [score, setScore] = useState(0);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOnly) {
      setFormData({ ...formData, phone: phoneOnly });
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
    }, 2000);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    try {
      await fetch('/api/trivia-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.phone,
          interests: selectedInterests,
          score,
          answers: selectedAnswers
        })
      });
      setStage('success');
    } catch (error) {
      console.error('Error:', error);
    }
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
        <div className="relative z-10 w-full max-w-3xl px-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-green-600/20 backdrop-blur-sm border border-green-400/50 rounded-full mb-8">
            <span className="text-green-400 font-medium text-lg">Trade Show Special • Limited Time</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 leading-tight">
            Test Your<br />
            <span className="text-green-400">Soil IQ</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-200 mb-12">
            5 expert questions. Win 20% off + Free Soil Kit.
          </p>
          
          {/* Phone Input */}
          <form onSubmit={handleStart} className="max-w-lg mx-auto mb-12">
            <div className="relative">
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneOnly}
                onChange={(e) => setPhoneOnly(e.target.value)}
                className="w-full px-8 py-7 text-2xl text-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-400/50 placeholder-gray-400"
                required
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white py-7 text-2xl font-bold rounded-2xl shadow-2xl transform transition-all hover:scale-[1.02] hover:shadow-green-500/25"
            >
              Start Quiz →
            </button>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-16 max-w-2xl w-full text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Thank You
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You scored {score} out of 5
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
            <p className="text-sm text-gray-600 mb-2">Your discount code:</p>
            <p className="text-3xl font-light text-green-700 tracking-wider">
              SOIL20
            </p>
            <p className="text-sm text-gray-600 mt-4">
              Valid for 20% off your first order
            </p>
          </div>
          
          <p className="text-gray-600">
            We've sent this code to your email
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-8 text-gray-600 hover:text-gray-800 underline"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'interests') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <div className="max-w-2xl w-full">
          <h2 className="text-4xl font-light text-center text-gray-900 mb-12">
            Almost done! What do you grow?
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-12">
            {['Vegetables', 'Cannabis', 'Landscaping', 
              'Indoor Plants', 'Lawn', 'Native Plants'].map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-8 text-xl rounded-xl transition-all ${
                  selectedInterests.includes(interest)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <input
              type="email"
              placeholder="Enter your email for discount code"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-8 py-6 text-xl text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600"
              required
            />

            <button
              onClick={handleSubmit}
              disabled={selectedInterests.length === 0 || !formData.email}
              className="w-full bg-green-600 text-white py-6 text-2xl font-medium rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Get My 20% Off
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-medium">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-lg font-medium">Score: {score}/{currentQuestion}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-16">
          {showFact ? (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                selectedAnswers[currentQuestion] === questions[currentQuestion].correct 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                <svg className={`w-12 h-12 ${
                  selectedAnswers[currentQuestion] === questions[currentQuestion].correct 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  {selectedAnswers[currentQuestion] === questions[currentQuestion].correct ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
              </div>
              <p className="text-3xl font-bold mb-4 text-gray-900">
                {selectedAnswers[currentQuestion] === questions[currentQuestion].correct ? 'Excellent!' : 'Not quite'}
              </p>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {questions[currentQuestion].fact}
              </p>
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