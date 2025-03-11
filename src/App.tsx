import "./App.css";
import { type AnyFieldApi, useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { Requirements } from "./Requirements";
import { FormSchema } from "./formSchema";

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
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      recaptchaCode: "",
    },
    validators: { onBlur: FormSchema },
    onSubmit: async ({ value }) => {
      // Reset the submit state
      setSubmitState("idle");

      // Simulate a server request for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      // If the name contains "google" simulate a recaptcha error
      if (value.name.includes("google")) {
        form.setFieldMeta("recaptchaCode", (meta) => {
          return {
            ...meta,
            errorMap: {
              ...meta.errorMap,
              // Make it look like a Zod error
              onBlur: {
                validation: "custom",
                code: "invalid_code",
                message: "ReCAPTCHA is invalid",
                path: ["recaptchaCode"],
              },
            },
          };
        });
        return;
      }

      // If the name contains "500" simulate a server error
      if (value.name.includes("500")) {
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    },
    onSubmitInvalid: () => {
      window.document.querySelector('[data-error="true"]')?.scrollIntoView();
      // onSubmitInvalid is only called the first time unfortunately https://github.com/TanStack/form/discussions/715
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
                await new Promise((resolve) => setTimeout(resolve, 1_000));
                return (
                  value.includes("dupe") && {
                    // Make it look like a Zod error
                    validation: "custom",
                    code: "already_in_use",
                    message: "Email already in use",
                    path: ["email"],
                  }
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
                    field.handleChange(e.target.value);
                    if (e.target.checked) {
                      // Simulate the official recaptcha widget, you get a code by proving you are not a robot
                      const randomCharacters = Math.random()
                        .toString(36)
                        .substring(7);
                      form.setFieldValue("recaptchaCode", randomCharacters);
                    } else {
                      form.setFieldValue("recaptchaCode", "");
                    }
                    // Trigger the form validation
                    form.validateField("recaptchaCode", "blur");
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
              {isSubmitting ? "..." : "Submit"}
            </button>
          )}
        />
        <div className="Debug">
          <strong>debug zone</strong>
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
      field.state.meta.errors.length ? (
        <em style={{ color: "red" }} data-error="true">
          {field.state.meta.errors.map((e) => e.message).join(", ")}
        </em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

export default App;
