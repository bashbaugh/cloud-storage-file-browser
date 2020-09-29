import React from 'react'
import './FileCard.css'
import { Card, List, Button, Icon, Dropdown } from 'semantic-ui-react'

const fileCard = ({ cardType, isFolder, name, size, fileType, url, lastMod, onDelete, onRename}) => {
  if (cardType === 'list') {
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
  } else {
    return (
      <Card>
        <Card.Content>

        </Card.Content>
      </Card>
    )
  }
}

export default fileCard