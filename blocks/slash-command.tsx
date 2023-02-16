import { FileBlockProps } from "@githubnext/blocks";
import { BaseStyles, Checkbox, CheckboxGroup, FormControl, Select, TextInput, Textarea, Text, Button, ThemeProvider } from "@primer/react";
import yaml from "js-yaml";
import { useEffect, useState } from "react";

export default function (props: FileBlockProps) {
  const { content, onUpdateContent } = props;

  const [values, setValues] = useState({})
  const [hasMounted, setHasMounted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const data = yaml.load(content) || {}
      const newValues = formConfig.reduce((acc, { name, defaultValue }) => {
        acc[name] = data[name] === undefined ? defaultValue : data[name]
        return acc
      }, {})
      setValues(newValues)
      setHasMounted(true)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [content])

  const rawYaml = yaml.dump(values)
  const updateContent = () => {
    if (!hasMounted) return
    onUpdateContent(rawYaml)
  }
  useEffect(() => { updateContent() }, [rawYaml])

  return (
    <ThemeProvider>
      <BaseStyles>
        {error ? (
          <div style={{ maxWidth: "40em", margin: "0 auto", padding: "3em 1em" }}>
            <div>
              <Text fontWeight="bold" fontSize={2} mb={2}>
                Error parsing YAML
              </Text>
            </div>
            <Text fontSize={1} fontFamily="mono" mt={3} display="block">
              {error}
            </Text>
            <Button sx={{ mt: 3 }}
              onClick={() => {
                const defaultValues = formConfig.reduce((acc, { name, defaultValue }) => {
                  acc[name] = defaultValue
                  return acc
                }, {})
                console.log(yaml.dump(defaultValues))
                onUpdateContent(yaml.dump(defaultValues))
                setValues(defaultValues)
              }}>
              Reset to default values
            </Button>
          </div>
        ) : (
          <div style={{ maxWidth: "40em", margin: "0 auto", padding: "3em 1em" }}>
            {formConfig.map(({ name, type, description, options = [], isHiddenFunc, isDisabledFunc, getValidationError }) => {
              const isHidden = isHiddenFunc?.(values)
              const isDisabled = isDisabledFunc?.(values)
              const validationError = getValidationError?.(values)

              if (isHidden) return null
              return (
                <FormControl key={name} sx={{ px: 3, py: 2, width: "100%" }}>
                  <FormControl.Label htmlFor={name}>{name}</FormControl.Label>
                  {description && (
                    <FormControl.Caption>
                      {description}
                    </FormControl.Caption>
                  )}
                  {type === "select" ? (
                    <Select id={name} name={name}
                      value={values[name]}
                      disabled={isDisabled}
                      onChange={e => {
                        setValues({ ...values, [name]: e.target.value })
                      }}
                      sx={{ width: "100%" }}>
                      {options.map((option: string) => (
                        <Select.Option key={option} value={option}>{option}</Select.Option>
                      ))}
                    </Select>
                  ) : type === "multi-select" ? (
                    <CheckboxGroup
                      disabled={isDisabled}>
                      {options.map((option: string) => (
                        <FormControl layout="horizontal" key={`${option}-${(values[name] || []).join(",")}`}>
                          <Checkbox
                            value={option}
                            defaultChecked={(values[name] || []).includes(option)}
                            onChange={e => {
                              const newValue = e.target.checked
                                ? [...(values[name] || []), option]
                                : (values[name] || []).filter((v: string) => v !== option)
                              setValues({ ...values, [name]: newValue })
                            }}
                          />
                          <FormControl.Label>
                            {option}
                          </FormControl.Label>
                        </FormControl>
                      ))}
                    </CheckboxGroup>
                  ) : type === "textarea" ? (
                    <Textarea
                      disabled={isDisabled}
                      value={values[name]}
                      onChange={e => {
                        setValues({ ...values, [name]: e.target.value })
                      }}
                      sx={{ width: "100%" }} id={name} name={name}
                    />
                  ) : (
                    <TextInput
                      disabled={isDisabled}
                      sx={{ width: "100%" }} id={name} name={name}
                      value={values[name]}
                      onChange={e => {
                        setValues({ ...values, [name]: e.target.value })
                      }} />
                  )}
                  {!!validationError && (
                    <FormControl.Validation variant="error">
                      {validationError}
                    </FormControl.Validation>
                  )}
                </FormControl>
              );
            })}
          </div>
        )}
      </BaseStyles>
    </ThemeProvider>
  );
}

const formConfig = [{
  name: "title",
  description: "When the slash command menu appears after typing \"/\" what should the title be? ",
  type: "text",
  defaultValue: "My slash command",
}, {
  name: "description",
  description: "",
  type: "textarea",
  defaultValue: ""
}, {
  name: "type",
  type: "select",
  description: "Type of slash command, can be Webhook or MD-Shortcut",
  options: ["webhook", "md_shortcut"],
  defaultValue: "webhook",
}, {
  name: "surfaces",
  description: "What surfaces the slash command should appear on when a user types \"/\"",
  type: "multi-select",
  options: ["issue_description", "issue_comment", "pull_request_description", "pull_request_comment"],
  defaultValue: ["issue_description", "issue_comment", "pull_request_description", "pull_request_comment"],
}, {
  name: "trigger-on",
  description: "What do users type to use this slash command",
  type: "text",
  defaultValue: "my-command",
  getValidationError: (values: any) => {
    const value = values["trigger-on"] || ""
    if (value.includes(" ")) return "Trigger on cannot contain spaces"
    return false
  }
}, {
  name: "value",
  description: "What should your trigger word be replaced with after the user hits enter?",
  type: "textarea",
  defaultValue: "",
  isHiddenFunc: (values: any) => values["type"] === "webhook",
  // isDisabledFunc: (values: any) => !!values["value_source"],
  getValidationError: (values: any) => {
    if (values["value_source"] && values["value"]) return "Cannot set both value and value_source"
    return false
  }
}, {
  name: "value_source",
  description: "Same as above, except pull a .md file for the contents",
  type: "text",
  defaultValue: "file.md",
  isHiddenFunc: (values: any) => values["type"] === "webhook",
  // isDisabledFunc: (values: any) => !!values["value"],
  getValidationError: (values: any) => {
    if (values["value_source"] && values["value"]) return "Cannot set both value and value_source"
    return false
  }
}]
