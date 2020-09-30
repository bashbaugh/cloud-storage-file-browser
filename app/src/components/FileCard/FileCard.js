import React from 'react'
import './FileCard.css'
import { Card, List, Button, Icon, Dropdown } from 'semantic-ui-react'

const fileCard = ({ cardType, isFolder, name, size, fileType, url, lastMod, onDelete, onRename}) => {
  if (cardType === 'list') { // File card for list view
    return (
      <List.Item>
        <List.Icon name={isFolder ? 'folder' : 'file'} size='large' verticalAlign='middle'/>
        <List.Content>
          <List.Header><a href={url || '#'} target='_blank'>{name}</a>
            <Dropdown>
              <Dropdown.Menu>
                {/*<Dropdown.Item icon='cloud download' text='Download' />*/}
                <Dropdown.Item icon='edit' text='Rename' onClick={onRename} />
                <Dropdown.Item icon='trash' text='Delete' onClick={onDelete} />
              </Dropdown.Menu>
            </Dropdown>
          </List.Header>
          <List.Description>
            {size} &middot;&nbsp;
            {isFolder ? 'folder' : fileType + ' file'} &middot;&nbsp;
            {isFolder ? '' : 'last modified ' + lastMod}
          </List.Description>
        </List.Content>
      </List.Item>
    )
  } else { // File card for card view
    return (
      <Card>
        <Card.Content>
          <Card.Header><a href={url || '#'} target='_blank'>{name}</a></Card.Header>
          <Card.Meta>
            {size} {isFolder ? 'folder' : fileType + ' file'}
          </Card.Meta>
          <Card.Description>
            <Icon name={isFolder ? 'folder' : 'file'}/>
            {isFolder ? '' : 'last modified ' + lastMod}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Button.Group fluid>
            <Button basic compact size='mini' color='purple' onClick={onRename}>
              <Icon name='edit outline'/>
              Rename
            </Button>
            <Button basic compact size='mini' color='red' onClick={onDelete}>
              <Icon name='trash alternate outline'/>
              Delete
            </Button>
          </Button.Group>
        </Card.Content>
      </Card>
    )
  }
}

export default fileCard