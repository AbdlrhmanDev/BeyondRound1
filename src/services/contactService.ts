/**
 * Contact Service - Handles contact form submissions
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
  created_at?: string;
}

/**
 * Submits contact form data to Supabase
 */
export const submitContactForm = async (
  data: ContactFormData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Input validation
    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!data.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!data.subject?.trim()) {
      return { success: false, error: 'Subject is required' };
    }
    if (!data.message?.trim()) {
      return { success: false, error: 'Message is required' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Insert into contact_submissions table
    const submission: ContactSubmission = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject.trim(),
      message: data.message.trim(),
      user_id: user?.id || null,
    };

    // Try to insert into contact_submissions table first
    // If table doesn't exist, fall back to feedback table
    let error;
    const { error: contactError } = await supabase
      .from('contact_submissions')
      .insert(submission);

    if (contactError) {
      // Fallback to feedback table if contact_submissions doesn't exist
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          category: 'contact',
          message: `Subject: ${data.subject}\n\nFrom: ${data.name} (${data.email})\n\nMessage:\n${data.message}`,
          metadata: {
            name: data.name,
            email: data.email,
            subject: data.subject,
          },
        });
      error = feedbackError;
    } else {
      error = contactError;
    }

    if (error) {
      console.error('Error submitting contact form:', error);
      return { 
        success: false, 
        error: 'Failed to submit your message. Please try again later.' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.' 
    };
  }
};

/**
 * Validates contact form data
 */
export const validateContactForm = (data: ContactFormData): { valid: boolean; errors: Partial<ContactFormData> } => {
  const errors: Partial<ContactFormData> = {};
  let valid = true;

  if (!data.name?.trim()) {
    errors.name = 'Name is required';
    valid = false;
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
    valid = false;
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
    valid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Invalid email format';
      valid = false;
    }
  }

  if (!data.subject?.trim()) {
    errors.subject = 'Subject is required';
    valid = false;
  } else if (data.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters';
    valid = false;
  }

  if (!data.message?.trim()) {
    errors.message = 'Message is required';
    valid = false;
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
    valid = false;
  }

  return { valid, errors };
};
