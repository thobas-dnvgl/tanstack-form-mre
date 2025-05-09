import { type AnyFieldApi, useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { ZodError, ZodIssueCode } from "zod";
import "./App.css";
import { Requirements } from "./Requirements";
import { FormSchema, type FormData } from "./formSchema";

declare global {
  interface Window {
    emailIsDupe: HTMLInputElement;
  }
  interface Window {
    recaptchaCodeRejected: HTMLInputElement;
  }
  interface Window {
    serverCrashed: HTMLInputElement;
  }
}

function App() {
  return (
    <div className="App">
      <Requirements />
      <Form />
    </div>
  );
}
function Form() {
  const serverErrorRef = useRef<HTMLDivElement>(null);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const defaultValues = {
    name: "",
    email: "",
    recaptchaCode: "",
  } as FormData;
  const form = useForm({
    defaultValues,
    validators: { onChange: FormSchema },
    canSubmitWhenInvalid: true,
    onSubmit: async ({ value, formApi }) => {
      console.info("submitting", value);
      setSubmitState("idle");
      // Simulate a server request
      await new Promise((resolve) => setTimeout(resolve, 2_000));

      if (window["recaptchaCodeRejected"].checked) {
        formApi.fieldInfo.recaptchaCode.instance?.setErrorMap({
          onChange: simulateZodError("ReCAPTCHA is invalid", ["recaptchaCode"]),
        });
        return;
      }

      if (window["serverCrashed"].checked) {
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    },
    onSubmitInvalid: () => {
      window.document.querySelector('[data-error="true"]')?.scrollIntoView();
    },
  });
  const { submissionAttempts } = useStore(form.store, (state) => ({
    submissionAttempts: state.submissionAttempts,
  }));

  // Scroll to error message if the HTTP request to submit the form failed
  useEffect(() => {
    if (submitState === "error") serverErrorRef.current?.scrollIntoView();
  }, [submitState]);

  if (submitState === "success") {
    return <div className="success">Form submitted with success!</div>;
  }

  return (
    <div className="Form">
      <h1>Contact Form Example</h1>
      {submitState === "error" && (
        <div style={{ color: "red" }} ref={serverErrorRef}>
          An error occurred while submitting the form. Please try again.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          <form.Field
            name="name"
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Name:</label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo
                    field={field}
                    submissionAttempts={submissionAttempts}
                  />
                </>
              );
            }}
          />
        </div>
        <div>
          <form.Field
            name="email"
            validators={{
              onBlurAsyncDebounceMs: 300,
              onBlurAsync: async ({ value }) => {
                await new Promise((resolve) => setTimeout(resolve, 2_000));
                return (
                  window["emailIsDupe"].checked &&
                  simulateZodError(`Email address ${value} already in use`, [
                    "email",
                  ])
                );
              },
            }}
            children={(field) => (
              <>
                <label htmlFor={field.name}>Email Address:</label>
                <input
                  type="email"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo
                  field={field}
                  submissionAttempts={submissionAttempts}
                />
              </>
            )}
          />
        </div>
        <div>
          <form.Field
            name="recaptchaCode"
            children={(field) => (
              <>
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    field.handleChange(checked ? generateRecaptchaCode() : "");
                    field.validate("change");
                  }}
                />
                <label htmlFor={field.name}>I am not a robot</label>
                <FieldInfo
                  field={field}
                  submissionAttempts={submissionAttempts}
                />
              </>
            )}
          />
        </div>
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.isValidating]}
          children={([isSubmitting, isValidating]) => (
            <button type="submit" disabled={isSubmitting || isValidating}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        />
        <div className="Debug">
          <strong>debug/config zone</strong>
          <div>
            <label>
              <input type="checkbox" id="emailIsDupe" /> Email async validation
              indicates a dupe
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" id="serverCrashed" /> Server returns an
              error 500
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" id="recaptchaCodeRejected" /> Server
              rejects ReCAPTCHA code
            </label>
          </div>
          <form.Subscribe
            selector={(state) => [state.values, state.errorMap, state.errors]}
            children={([values, errorMap, errors]) => (
              <div>
                <pre>
                  <code>
                    {JSON.stringify({ values, errorMap, errors }, null, 2)}
                  </code>
                </pre>
              </div>
            )}
          />
        </div>
      </form>
    </div>
  );
}

function FieldInfo({
  field,
  submissionAttempts,
}: {
  field: AnyFieldApi;
  submissionAttempts: number;
}) {
  return (
    <>
      {(field.state.meta.isTouched || submissionAttempts > 0) &&
      !field.state.meta.isValid ? (
        <em style={{ color: "red" }} data-error="true">
          {field.state.meta.errors.map((e) => e.message).join(", ")}
        </em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

function simulateZodError(message: string, path: string[]) {
  return new ZodError([
    {
      code: ZodIssueCode.custom,
      message,
      path,
    },
  ]).errors[0];
}

function generateRecaptchaCode(max = 8) {
  return Math.random().toString(36).substring(max);
}

export default App;
