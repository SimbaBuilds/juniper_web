# 📱 React Config Form Rendering Guide: Mobile Integration with Static Values

## Overview
This guide covers how to handle rendering the setup guide and config form when dealing with hardcoded redirect URIs and service-specific scopes for mobile app integration.

## 🔧 Config Form Field Handling

### 1. **Static Redirect URI Field**
The redirect URI field comes with special properties for mobile integration:

```javascript
// Field structure from backend
{
  "field_name": "redirect_uri",
  "field_type": "text",
  "label": "Redirect URI",
  "placeholder": "jarvis://oauth/callback",
  "default_value": "jarvis://oauth/callback",
  "required": true,
  "readonly": true,  // ⚠️ KEY: This field should not be editable
  "description": "Static mobile app redirect URI - DO NOT CHANGE. Use this exact URI in your developer console."
}
```

**React Implementation:**
```jsx
const renderRedirectUriField = (field) => {
  return (
    <div className="form-field redirect-uri-field">
      <label className="field-label required">
        {field.label}
        <span className="mobile-badge">📱 Mobile</span>
      </label>
      
      <div className="static-field-container">
        <input
          type="text"
          value={field.default_value}
          readOnly={true}
          className="form-input readonly-input"
          style={{
            backgroundColor: '#f8f9fa',
            border: '2px solid #28a745',
            cursor: 'not-allowed'
          }}
        />
        <button
          className="copy-button"
          onClick={() => copyToClipboard(field.default_value)}
          title="Copy redirect URI"
        >
          📋 Copy
        </button>
      </div>
      
      <div className="field-description static-field-note">
        <strong>⚠️ IMPORTANT:</strong> {field.description}
      </div>
    </div>
  );
};
```

### 2. **Pre-filled Scopes Field**
Scopes come pre-researched but remain editable for customization:

```javascript
// Field structure from backend
{
  "field_name": "scopes",
  "field_type": "text",
  "label": "OAuth Scopes",
  "placeholder": "read write send",
  "default_value": "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
  "required": false,
  "description": "Recommended scopes for optimal Gmail integration. You can modify these if needed."
}
```

**React Implementation:**
```jsx
const renderScopesField = (field) => {
  const [scopesValue, setScopesValue] = useState(field.default_value || '');
  const [showScopeHelper, setShowScopeHelper] = useState(false);
  
  return (
    <div className="form-field scopes-field">
      <label className="field-label">
        {field.label}
        <span className="researched-badge">🔍 Auto-researched</span>
      </label>
      
      <div className="scopes-input-container">
        <textarea
          value={scopesValue}
          onChange={(e) => setScopesValue(e.target.value)}
          placeholder={field.placeholder}
          className="form-textarea scopes-input"
          rows={3}
        />
        <button
          className="scope-helper-button"
          onClick={() => setShowScopeHelper(!showScopeHelper)}
        >
          ℹ️ Scope Info
        </button>
      </div>
      
      {showScopeHelper && (
        <div className="scope-helper-panel">
          <h4>📋 Recommended Scopes Breakdown:</h4>
          <ul>
            {scopesValue.split(' ').map((scope, index) => (
              <li key={index}>
                <code>{scope}</code> - {getScopeDescription(scope)}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="field-description">
        <strong>💡 Tip:</strong> {field.description}
      </div>
    </div>
  );
};
```

## 📋 Setup Instructions Rendering

### 3. **Enhanced Setup Guide Display**
The setup instructions now include mobile-specific guidance and static values:

```jsx
const SetupInstructionsPanel = ({ setupInstructions, mobileConfig }) => {
  const [copiedItem, setCopiedItem] = useState(null);
  
  const copyToClipboard = async (text, itemName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="setup-instructions-panel">
      {/* Mobile Integration Callout */}
      <div className="mobile-integration-callout">
        <div className="callout-header">
          <span className="mobile-icon">📱</span>
          <h3>Mobile App Integration</h3>
        </div>
        <div className="static-values-summary">
          <div className="static-value-item">
            <label>Redirect URI:</label>
            <div className="value-with-copy">
              <code>{mobileConfig.redirect_uri}</code>
              <button 
                onClick={() => copyToClipboard(mobileConfig.redirect_uri, 'redirect')}
                className={`copy-btn ${copiedItem === 'redirect' ? 'copied' : ''}`}
              >
                {copiedItem === 'redirect' ? '✅' : '📋'}
              </button>
            </div>
          </div>
          
          {mobileConfig.recommended_scopes && (
            <div className="static-value-item">
              <label>Recommended Scopes:</label>
              <div className="scopes-list">
                {mobileConfig.recommended_scopes.map((scope, index) => (
                  <span key={index} className="scope-tag">{scope}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Rendered Markdown Instructions */}
      <div className="setup-instructions-content">
        <ReactMarkdown 
          components={{
            // Custom renderer for code blocks containing static values
            code: ({ children, className }) => {
              const isStaticValue = children === mobileConfig.redirect_uri || 
                                  mobileConfig.recommended_scopes?.includes(children);
              
              return (
                <code 
                  className={`${className} ${isStaticValue ? 'static-value' : ''}`}
                  onClick={isStaticValue ? () => copyToClipboard(children, 'code') : undefined}
                >
                  {children}
                  {isStaticValue && <span className="copy-hint">📋</span>}
                </code>
              );
            },
            
            // Highlight important sections
            blockquote: ({ children }) => (
              <div className="important-callout">
                {children}
              </div>
            )
          }}
        >
          {setupInstructions}
        </ReactMarkdown>
      </div>
    </div>
  );
};
```

## 🎨 CSS Styling Recommendations

### 4. **Mobile-Specific Styling**
```css
/* Static field styling */
.readonly-input {
  background-color: #f8f9fa !important;
  border: 2px solid #28a745 !important;
  cursor: not-allowed;
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: bold;
}

.static-field-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.copy-button:hover {
  background: #0056b3;
}

/* Mobile integration callout */
.mobile-integration-callout {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.static-value-item {
  margin: 10px 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.value-with-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.static-value code {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
}

/* Scope-specific styling */
.scopes-input {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
}

.scope-tag {
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 12px;
  font-size: 11px;
  font-family: monospace;
}

.scope-helper-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
}

/* Badge styling */
.mobile-badge, .researched-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.mobile-badge {
  background: #28a745;
  color: white;
}

.researched-badge {
  background: #17a2b8;
  color: white;
}
```

## 🔄 State Management

### 5. **Form State Handling**
```jsx
const ConfigFormComponent = ({ configFormData }) => {
  const [formState, setFormState] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Initialize form with default values (including static ones)
  useEffect(() => {
    const initialState = {};
    configFormData.form_fields.forEach(field => {
      if (field.default_value) {
        initialState[field.field_name] = field.default_value;
      }
    });
    setFormState(initialState);
  }, [configFormData]);
  
  const handleFieldChange = (fieldName, value, field) => {
    // Prevent changes to readonly fields
    if (field.readonly) {
      return;
    }
    
    setFormState(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    configFormData.form_fields.forEach(field => {
      if (field.required && !formState[field.field_name]) {
        errors[field.field_name] = `${field.label} is required`;
      }
      
      // Special validation for redirect URI
      if (field.field_name === 'redirect_uri' && 
          formState[field.field_name] !== field.default_value) {
        errors[field.field_name] = 'Redirect URI must not be changed for mobile integration';
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {configFormData.form_fields.map(field => (
        <div key={field.field_name} className="form-group">
          {renderFieldByType(field, formState, handleFieldChange, validationErrors)}
        </div>
      ))}
    </form>
  );
};
```

## 📱 Mobile-Specific UX Considerations

### 6. **User Experience Enhancements**
- **Visual Indicators**: Use badges and icons to clearly mark mobile-optimized fields
- **Copy Functionality**: Make it easy to copy static values (redirect URI, scopes)
- **Validation**: Prevent users from changing readonly fields
- **Tooltips**: Provide context for why certain values are static
- **Progressive Disclosure**: Show scope details on demand to avoid overwhelming users
- **Error Prevention**: Clear messaging about what values should not be changed

### 7. **Accessibility**
```jsx
// Ensure readonly fields are properly announced to screen readers
<input
  type="text"
  value={field.default_value}
  readOnly={true}
  aria-label={`${field.label} (read-only, pre-configured for mobile)`}
  aria-describedby={`${field.field_name}-description`}
/>

<div id={`${field.field_name}-description`} className="sr-only">
  This field is pre-configured for mobile app integration and cannot be changed.
</div>
```

## 🚀 Implementation Checklist

- [ ] Handle readonly redirect URI field with copy functionality
- [ ] Pre-fill scopes field with researched values
- [ ] Render mobile integration callout panel
- [ ] Implement copy-to-clipboard for static values
- [ ] Add visual indicators for mobile-optimized fields
- [ ] Style static fields distinctly from editable ones
- [ ] Validate that readonly fields aren't modified
- [ ] Add scope breakdown helper panel
- [ ] Ensure accessibility for readonly fields
- [ ] Test responsive design for mobile viewing

This approach ensures users understand they're setting up mobile integration while providing them with optimal, pre-researched configuration values that minimize setup errors.