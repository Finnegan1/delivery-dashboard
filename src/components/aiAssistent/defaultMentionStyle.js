const darkModeStyles = {
  width: '100%',
  height: '80px',
  control: {
    backgroundColor: '#121212',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'normal',
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',
      minHeight: 63,
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
    },
    highlighter: {
      padding: 9,
      border: '1px solid transparent',
    },
    input: {
      padding: 9,
      border: '1px solid #424242',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
    },
  },

  '&singleLine': {
    display: 'inline-block',
    width: 180,
    highlighter: {
      padding: 1,
      border: '2px inset transparent',
    },
    input: {
      padding: 1,
      border: '2px inset #424242',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
    },
  },

  suggestions: {
    list: {
      backgroundColor: '#1e1e1e',
      border: '1px solid #424242',
      fontSize: 14,
      color: '#ffffff',
    },
    item: {
      padding: '5px 15px',
      borderBottom: '1px solid #424242',
      '&focused': {
        backgroundColor: '#333333',
      },
    },
  },
}

export default darkModeStyles
