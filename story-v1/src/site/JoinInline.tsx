import { useId, useState, type FormEvent } from 'react';
import { Check } from '@phosphor-icons/react';
import { Arrow } from './ui';

// The waitlist on the page itself: a pill field with the pill button inside it. An address that is not
// one says so under the field; a good one turns the form into the success line, its tick drawing in.
// Like the dialog's card, nothing is sent anywhere yet.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function JoinInline() {
  const id = useId();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!EMAIL.test(value)) {
      setError(value ? 'That address is missing something. Check it and try again.' : 'Enter your email address to join.');
      return;
    }
    setError('');
    setJoined(true);
  };

  if (joined)
    return (
      <p className="join-done" role="status">
        <span className="join-tick" aria-hidden="true">
          <Check weight="bold" />
        </span>
        You&rsquo;re on the list. He&rsquo;ll light a lantern for you, and we&rsquo;ll email you when your seat opens.
      </p>
    );

  return (
    <form className="join" noValidate onSubmit={submit}>
      <label htmlFor={`${id}-email`}>Your email</label>
      <div className="join-field">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onInput={() => error && setError('')}
        />
        <button type="submit" className="btn">
          Get early access <Arrow />
        </button>
      </div>
      <p id={`${id}-error`} className="join-error" aria-live="polite">
        {error}
      </p>
    </form>
  );
}
