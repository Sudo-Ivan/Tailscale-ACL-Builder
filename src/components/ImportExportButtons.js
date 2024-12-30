import React from 'react';

const ImportExportButtons = ({ onImport, onExport }) => {
  const handleImport = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'ACL JSON Files',
            accept: {
              'application/json': ['.json', '.hujson']
            }
          }
        ]
      });
      const file = await fileHandle.getFile();
      const content = await file.text();
      onImport(content);
    } catch (err) {
      console.error('Error importing file:', err);
    }
  };

  return (
    <div className="import-export-buttons">
      <button onClick={handleImport}>Import ACL</button>
      <button onClick={onExport}>Export ACL</button>
    </div>
  );
};

export default ImportExportButtons; 