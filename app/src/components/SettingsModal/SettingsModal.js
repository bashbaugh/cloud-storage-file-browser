import React, { useState, useEffect } from 'react'
import { Modal, Button, Transition, Checkbox, Icon } from 'semantic-ui-react'
import { toast } from 'react-toastify'
import api from '../../api/storage'

const SettingsModal = ({ open, closeModal }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const [settings, setSettings] = useState({})

  useEffect(() => {
    if (!open) return
    api.getSettings().then(s => {
      // Default settings:
      setSettings(s.useSettings ? s : {
        useSettings: true,
        defaultPublicFiles: false
      })
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    setSaving(true)
    setError(false)
    api.saveSettings(settings)
      .then(() => setSaving(false))
      .catch(err => setError(true))
  }, [settings])

  const close = () => {setError(false); setSaving(false); closeModal()}

  return (
    <div>
      <Modal open={open} onClose={close} size='large' centered={false} dimmer='inverted'>
        <Modal.Header>Options & Settings</Modal.Header>
        <Modal.Content>
          <Modal.Description style={{ marginBottom: '15px'}}>
            Your settings will be saved in a file in your storage bucket.
          </Modal.Description>
          <Checkbox
            toggle
            label={`Set uploaded files to ${settings.defaultPublicFiles ? 'public' : 'private'} by default`}
            checked={settings.defaultPublicFiles}
            onClick={() => setSettings({...settings, defaultPublicFiles: !settings.defaultPublicFiles})}
          />
        </Modal.Content>
        <Modal.Actions>
          <p style={{color: error ? 'red' : 'green', fontWeight: 'bold'}}>
            {!saving && <Icon name='check'/>}
            { error ? `An error occurred.` : saving ? 'Saving your settings....' : 'Settings saved' }
          </p>
          <Button onClick={close}>
            Close
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default SettingsModal