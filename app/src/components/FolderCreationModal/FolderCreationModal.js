import React, { useState, useEffect } from 'react'
import { Modal, Button, Icon, Input } from 'semantic-ui-react'
import api from '../../api/storage'

const FolderUploadModal = ({ open, closeModal, path }) => {

  const createFolder = () => {

  }

  return (
    <div>
      <Modal open={open} onClose={closeModal} size='tiny'>
        <Modal.Header>Create Folder</Modal.Header>
        <Modal.Content>
          <Modal.Description style={{ marginBottom: '15px'}}>
            Your new folder will be created in the current directory.
          </Modal.Description>
          <Input label={(path[path.length - 1] || '') + '/'} placeholder='New Folder Name' size='large'/>
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={closeModal}>
            Cancel
          </Button>
          <Button color='orange' onClick={createFolder}>
            <Icon name='plus circle'/>
            Add Folder
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default FolderUploadModal