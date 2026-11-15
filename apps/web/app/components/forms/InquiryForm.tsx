import { inquirySchema, inquiryDateBounds, type PublicConfig } from '@radiant/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { apiRequest, APIError } from '../../lib/api';
const initial = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contactMethod: 'email',
  postalCode: '',
  shootType: '',
  preferredDay: '',
  specialRequests: '',
  sessionLengthHours: '',
  numberOfPeople: '',
  shootLocation: '',
  referralSource: '',
  message: '',
};
type Field = keyof typeof initial;
const labels: Record<Field, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  phone: 'Phone number',
  contactMethod: 'Preferred contact method',
  postalCode: 'Postal code',
  shootType: 'Shoot type',
  preferredDay: 'Preferred day',
  specialRequests: 'Special requests',
  sessionLengthHours: 'Session length (hours)',
  numberOfPeople: 'Number of people',
  shootLocation: 'Shoot location',
  referralSource: 'How did you hear about us?',
  message: 'Message',
};
export function InquiryForm({
  config,
  refresh,
}: {
  config: PublicConfig;
  refresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [token, setToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'uncertain' | 'confirmed'>(
    'idle',
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const busy = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) summary.current?.focus();
  }, [message, errors]);
  const bounds = inquiryDateBounds(config.timezone, new Date());
  const locked = state !== 'idle';
  function resetCaptcha() {
    setToken('');
    setCaptchaKey((key) => key + 1);
    setCaptchaError('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || state !== 'idle') return;
    const input = {
      ...draft,
      sessionLengthHours: draft.sessionLengthHours === '' ? '' : Number(draft.sessionLengthHours),
      numberOfPeople: draft.numberOfPeople === '' ? '' : Number(draft.numberOfPeople),
      turnstileToken: token,
    };
    const parsed = inquirySchema(config, new Date()).safeParse(input);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
        ),
      );
      setMessage('Please check the highlighted fields.');
      return;
    }
    busy.current = true;
    setState('sending');
    setErrors({});
    setMessage('');
    try {
      const result = await apiRequest<{ status: string }>('/inquiries', {
        method: 'POST',
        body: parsed.data,
        signal: AbortSignal.timeout(10000),
      });
      if (result.status !== 'sent') throw new Error('Unrecognized delivery outcome');
      setState('sent');
    } catch (error: unknown) {
      if (
        error instanceof APIError &&
        ([400, 429].includes(error.status) ||
          (error.code === 'email_not_sent' && error.retryable === true))
      ) {
        setState('idle');
        setErrors(error.fields ?? {});
        setMessage(error.message);
        if (error.status === 400) void refresh();
      } else {
        setState('uncertain');
        setMessage(
          'Your inquiry may have been sent. Please check receipt with Rebekah before sending again.',
        );
      }
    } finally {
      busy.current = false;
      resetCaptcha();
    }
  }
  function field(
    name: Field,
    options: {
      type?: string;
      required?: boolean;
      choices?: readonly string[];
      multiline?: boolean;
      autoComplete?: string;
      help?: string;
      min?: string | number;
      max?: string | number;
    } = {},
  ) {
    const common = {
      id: name,
      name,
      value: draft[name],
      required: options.required ?? false,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': `${name}-help${errors[name] ? ` ${name}-error` : ''}`,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => setDraft((previous) => ({ ...previous, [name]: event.target.value })),
    };
    return (
      <div className={`field ${options.multiline ? 'full-width' : ''}`}>
        <label htmlFor={name}>{labels[name]}</label>
        {options.choices ? (
          <select {...common}>
            <option value="">Choose an option</option>
            {options.choices.map((option) => (
              <option key={option} value={option}>
                {option[0]?.toUpperCase()}
                {option.slice(1)}
              </option>
            ))}
            {draft[name] && !options.choices.includes(draft[name]) && (
              <option value={draft[name]}>{draft[name]} (no longer available)</option>
            )}
          </select>
        ) : options.multiline ? (
          <textarea {...common} maxLength={2000} />
        ) : (
          <input
            {...common}
            type={options.type ?? 'text'}
            autoComplete={options.autoComplete}
            min={options.min}
            max={options.max}
            maxLength={
              name === 'firstName' || name === 'lastName'
                ? 80
                : name === 'email'
                  ? 254
                  : name === 'phone'
                    ? 20
                    : name === 'postalCode'
                      ? 12
                      : undefined
            }
          />
        )}
        <p className="field-help" id={`${name}-help`}>
          {options.help ?? (options.required ? 'Required' : 'Optional')}
        </p>
        {errors[name] && (
          <p className="error" id={`${name}-error`}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Photography inquiry">
      {message && (
        <div ref={summary} className="error-summary" role="alert" tabIndex={-1}>
          <p>{message}</p>
          {Object.keys(errors).length > 0 && (
            <ul>
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>
                  <a href={`#${key}`}>{value}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <fieldset disabled={locked}>
        <legend>Your details</legend>
        <div className="form-grid">
          {field('firstName', { required: true, autoComplete: 'given-name' })}
          {field('lastName', { required: true, autoComplete: 'family-name' })}
          {field('email', { required: true, type: 'email', autoComplete: 'email' })}
          {field('contactMethod', { required: true, choices: ['email', 'call', 'text'] })}
          {field('phone', {
            required: draft.contactMethod !== 'email',
            type: 'tel',
            autoComplete: 'tel',
            help: 'Required if you prefer a call or text.',
          })}
          {field('postalCode', { autoComplete: 'postal-code' })}
        </div>
      </fieldset>
      <fieldset disabled={locked}>
        <legend>Your session</legend>
        <div className="form-grid">
          {field('shootType', { required: true, choices: ['maternity', 'newborn', 'family'] })}
          {field('preferredDay', {
            type: 'date',
            min: bounds.min,
            max: bounds.max,
            help: `Optional · Dates use ${config.timezone}. This is a preference, not a reservation.`,
          })}
          {field('sessionLengthHours', { type: 'number', min: 1, max: 4 })}
          {field('numberOfPeople', { type: 'number', min: 1, max: 12 })}
          {field('shootLocation', { choices: config.shootLocations })}
          {field('referralSource', { choices: config.referralSources })}
          {field('specialRequests', { multiline: true })}
          {field('message', { multiline: true })}
        </div>
      </fieldset>
      {state === 'idle' && (
        <div id="turnstileToken" className="field">
          <Turnstile
            key={captchaKey}
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
            options={{ action: 'inquiry', theme: 'light' }}
            onSuccess={(value) => {
              setToken(value);
              setCaptchaError('');
            }}
            onExpire={() => setToken('')}
            onError={() => {
              setToken('');
              setCaptchaError('Verification is unavailable. Please try again shortly.');
            }}
          />
          {captchaError && <p role="status">{captchaError}</p>}
          {errors.turnstileToken && <p className="error">{errors.turnstileToken}</p>}
        </div>
      )}
      <button type="submit" disabled={locked || !token}>
        {state === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
      {state === 'sending' && (
        <p role="status">Sending your inquiry. Please keep this page open.</p>
      )}
      {state === 'sent' && (
        <div className="status-panel" role="status">
          <h2>Thank you for getting in touch.</h2>
          <p>
            Your inquiry was accepted for delivery. This is not a booking confirmation; Rebekah will
            be in touch to discuss your session.
          </p>
        </div>
      )}
      {state === 'confirmed' && (
        <div className="status-panel" role="status">
          <h2>Receipt confirmed</h2>
          <p>No additional inquiry has been sent.</p>
        </div>
      )}
      {state === 'uncertain' && (
        <section className="status-panel" aria-label="Check inquiry receipt">
          <h2>Check before sending again</h2>
          <p>
            Email Rebekah to ask whether your inquiry arrived. If receipt is still unknown, keep
            this page open and wait for her reply. Opening your email app or waiting does not send
            this form again.
          </p>
          <p>
            <a href={`mailto:${config.publicContactEmail}`}>{config.publicContactEmail}</a>
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setState('confirmed');
              setMessage('');
            }}
          >
            Rebekah confirmed receipt
          </button>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />{' '}
              Rebekah checked and asked me to send again
            </label>
          </div>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={() => {
              setState('idle');
              setAcknowledged(false);
              setMessage('');
              setErrors({});
              resetCaptcha();
            }}
          >
            Start a new submission
          </button>
          <p className="field-help">
            Your draft stays here. Complete a fresh verification, then choose Send inquiry.
            Duplicate and rate limits still apply.
          </p>
        </section>
      )}
    </form>
  );
}
