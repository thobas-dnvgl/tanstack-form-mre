export function Requirements() {
  return (
    <div className="Requirements">
      <h1>Requirements</h1>
      <ul>
        <li>
          ✅ The name is required, should have 3 characters minimum (once
          trimmed), with proper error messages depending on the error.
        </li>
        <li>
          ✅ The email field is required, should be a valid email address and
          not be in our database already (<code>dupe</code> in the email will
          simulate a "duplicate" error).
        </li>
        <li>
          ✅ A spinner or a message should be displayed when the email address
          is verifier not to be present in the database already.
        </li>
        <li>
          ✅ Field error messages are only displayed if:
          <ul>
            <li>The form has been submitted at least once or</li>
            <li>The field has been "touched"</li>
          </ul>
        </li>
        <li>
          ✅ Submit button disabled while sending form data to server to prevent
          2nd submission.
        </li>
        <li>
          ✅ Display an error at the top and scroll to it when the server
          returned an error (other than ReCAPTCHA error).
        </li>
        <li>
          ⚠️ There is (fake) ReCAPTCHA, considered as any other form field.
          <br />
          <small>
            It's almost implemented as I want, if you have <code>google</code>{" "}
            in your name, the error returned by the server will be displayed as
            a field error. BUT in the debug zone you can see that{" "}
            <code>errors</code> and <code>errorMap</code> in the form state have
            NOT been updated.
          </small>
        </li>
        <li>
          ⚠️ Scroll to the first error when trying to submit the form but it
          contains errors (useful for very long forms).
          <br />
          <small>
            It works only the first time, because{" "}
            <a
              href="https://github.com/TanStack/form/discussions/715"
              target="_blank"
            >
              onSubmitInvalid is only called once unfortunately #715
            </a>
          </small>
        </li>
        <li>
          ⚠️ Zod is used to validate the form data.
          <br />
          <small>
            I guess it could be green, but twice in the form I am faking Zod
            errors (email already in sue and server invalidated ReCAPTCHA code).
            I am just wondering if it's the best approach?
          </small>
        </li>
        <li>
          ❌ Fields are validate <code>onChange</code> and not{" "}
          <code>onBlur</code> once their error has been displayed.
          <br />
          <small>
            From a UX perspective I do not want to see the error that my name
            should be at least 3 characters when I just start typing it. Same
            with the email addresse, I know it's invalid until I start type the
            TLD... But once the error is displayed, I prefer a rapid feedback
            while editing the field's content.
          </small>
        </li>
      </ul>
    </div>
  );
}
