import React, { useState, useEffect } from 'react'
import { Modal, Button, Icon, Input,  } from 'semantic-ui-react'
import api from '../../api/storage'

const FolderUploadModal = ({ open, closeModal, path, onSuccess }) => {
  const [folderPath, setFolderPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const createFolder = () => {
    setSaving(true)
    api.addFolder(folderPath)
      .then((res) => {
        setSaving(false)
        setError(false)
        if (res.data.saved) onSuccess()
      })
      .catch((err) => {
        setSaving(false)
        setError(true)
      })
  }

  const close = () => {setError(false); setSaving(false); closeModal()}

  return (
    <div>
      <Modal open={open} onClose={close} size='tiny'>
        <Modal.Header>Create Folder</Modal.Header>
        <Modal.Content>
          <Modal.Description style={{ marginBottom: '15px'}}>
            Your new folder will be created in the current directory.
          </Modal.Description>
          <Input
            label={(path[path.length - 1] || '') + '/'}
            placeholder='New Folder Name'
            size='large'
            onChange={e => setFolderPath((path.length? path.join('/') + '/' : '') + e.target.value)}
          />
          { error && <p style={{color: 'red', margin: '10px 0'}}>Something went wrong and we couldn't create that folder.</p>}
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={close}>
            Cancel
          </Button>
          <Button color='orange' onClick={createFolder}>
            <Icon name='plus circle' loading={saving}/>
            { saving ? 'Adding...' : 'Add Folder' }
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default FolderUploadModal