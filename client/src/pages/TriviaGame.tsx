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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-2xl text-center">
          {/* Main Content */}
          <h1 className="text-7xl font-light text-gray-900 mb-6">
            Know Your Soil?
          </h1>
          <p className="text-3xl text-gray-600 mb-16">
            5 questions. 20% off.
          </p>
          
          {/* Single Input Form */}
          <form onSubmit={handleStart} className="mb-16">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneOnly}
              onChange={(e) => setPhoneOnly(e.target.value)}
              className="w-full px-8 py-8 text-2xl text-center border-2 border-gray-200 rounded-2xl mb-8 focus:outline-none focus:border-green-600"
              required
              autoFocus
            />
            
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-8 text-3xl font-medium rounded-2xl hover:bg-green-700 transition-colors shadow-lg"
            >
              Start Quiz
            </button>
          </form>
          
          {/* Sample Question Preview */}
          <div className="bg-gray-50 rounded-2xl p-8 max-w-xl mx-auto">
            <p className="text-sm text-gray-500 mb-4">SAMPLE QUESTION</p>
            <p className="text-xl text-gray-800 font-medium mb-6">
              What percentage of Earth's soil is healthy?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg text-lg">5%</div>
              <div className="bg-white p-4 rounded-lg text-lg">15%</div>
              <div className="bg-white p-4 rounded-lg text-lg">30%</div>
              <div className="bg-white p-4 rounded-lg text-lg">50%</div>
            </div>
          </div>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-sm max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="px-8 pt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-sm text-gray-600">Score: {score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-16">
          {showFact ? (
            <div className="text-center py-16">
              <p className="text-2xl font-light text-gray-900 mb-4">
                {selectedAnswers[currentQuestion] === questions[currentQuestion].correct ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {questions[currentQuestion].fact}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-light text-center text-gray-900 mb-12">
                {questions[currentQuestion].question}
              </h1>

              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="p-6 text-lg text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    {option}
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