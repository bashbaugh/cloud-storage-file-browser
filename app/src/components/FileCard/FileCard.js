import React, { useState } from 'react'
import './FileCard.css'
import { Card, List, Button, Icon, Dropdown, Checkbox } from 'semantic-ui-react'

const FileCard = ({ cardType, isFolder, name, size, fileType, lastMod, downloadLink, checkIsPublic, onDelete, onRename, onClickItem, onSetPublic}) => {
  const [isPublic, setIsPublic] = useState(false)

  if (cardType === 'list') { // File card for list view
    return (
      <List.Item>
        <List.Icon name={isFolder ? 'folder' : 'file'} size='large' verticalAlign='middle'/>
        <List.Content>
          <List.Header><a href='#' onClick={onClickItem}>{name}</a>
            <Dropdown onClick={async () => setIsPublic(await checkIsPublic())}>
              <Dropdown.Menu>
                {/*<Dropdown.Item icon='cloud download' text='Download' />*/}
                <Dropdown.Item icon='download' text='Download' disabled={isFolder} onClick={() => window.open(downloadLink, '_blank')} />
                <Dropdown.Divider/>
                <Dropdown.Item icon={isPublic ? 'lock' : 'unlock'} text={isPublic ? 'Make private' : 'Make public'} disabled={isFolder} onClick={() => {onSetPublic(!isPublic)}}/>
                <Dropdown.Item icon='edit' text='Rename' onClick={onRename} />
                <Dropdown.Item icon='trash' text='Delete' onClick={onDelete} />
              </Dropdown.Menu>
            </Dropdown>
          </List.Header>
          <List.Description>
            {!isFolder && size}
            {isFolder ? 'folder' : ` \u00B7 ${fileType} `}
            {!isFolder && ` \u00B7 last modified ${lastMod} `}
          </List.Description>
        </List.Content>
      </List.Item>
    )
  } else { // File card for card view
    return (
      <Card>
        <Card.Content>
          <Card.Header><a href='#' onClick={onClickItem}>{name}</a></Card.Header>
          <Card.Meta>
            {!isFolder && size}
            {isFolder ? 'folder' : ` \u00B7 ${fileType} `}
          </Card.Meta>
          <Card.Description>
            <Icon name={isFolder ? 'folder' : 'file'}/>
            {!isFolder && ` \u00B7 last modified ${lastMod} `}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Button.Group fluid>
            { !isFolder && <Button basic compact size='mini' color='green' onClick={() => window.open(downloadLink, '_blank')}>
              <Icon name='download'/>
            </Button>}
            <Button basic compact size='mini' color='blue' onClick={onRename}>
              <Icon name='edit outline'/>
            </Button>
            <Button basic compact size='mini' color='red' onClick={onDelete}>
              <Icon name='trash alternate outline'/>
            </Button>
          </Button.Group>
        </Card.Content>
      </Card>
    )
  }
}

export default FileCard