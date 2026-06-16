import React, { useState } from 'react';
import { useLocation } from 'wouter';

const CRMForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, navigate] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crm-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowSuccess(true);
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '60px 40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '30px'
          }}>🎉</div>
          <h1 style={{
            fontSize: '36px',
            color: '#10b981',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>Thank You!</h1>
          <p style={{
            fontSize: '24px',
            color: '#374151',
            marginBottom: '40px'
          }}>
            Your information has been saved.
          </p>
          <div style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '40px'
          }}>
            <p style={{
              fontSize: '20px',
              marginBottom: '10px'
            }}>Your 10% Discount Code:</p>
            <p style={{
              fontSize: '36px',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}>WELCOME10</p>
          </div>
          <p style={{
            fontSize: '18px',
            color: '#6b7280'
          }}>
            We'll contact you soon about your landscaping needs!
          </p>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', company: '' });
              setShowSuccess(false);
            }}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '20px 40px',
              fontSize: '20px',
              borderRadius: '10px',
              border: 'none',
              marginTop: '30px',
              cursor: 'pointer'
            }}
          >
            Add Another Contact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '40px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '60px 40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '36px',
          color: '#10b981',
          marginBottom: '10px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Join Our Network
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#6b7280',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Get 10% off your first order!
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              color: '#374151',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '20px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                outline: 'none'
              }}
              placeholder="John Doe"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              color: '#374151',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '20px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                outline: 'none'
              }}
              placeholder="john@company.com"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              color: '#374151',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '20px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                outline: 'none'
              }}
              placeholder="(555) 123-4567"
            />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              color: '#374151',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              Company (Optional)
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '20px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                outline: 'none'
              }}
              placeholder="ABC Landscaping"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '25px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
              border: 'none',
              borderRadius: '15px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              minHeight: '70px'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Get My 10% Discount'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '30px',
          fontSize: '16px',
          color: '#9ca3af'
        }}>
          We respect your privacy and won't spam you.
        </p>
      </div>
    </div>
  );
};

export default CRMForm;
