import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  Typography,
  Paper,
} from '@mui/material'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MentionsInput, Mention } from 'react-mentions'
import darkModeStyles from './defaultMentionStyle'
import {removeBetweenMarkers} from '../../util'
import {
  PATH_KEY,
  PATH_POS_KEY,
} from '../../consts'

import { aiAssistant } from '../../api'
import Lottie from "lottie-react";
import loadingPlant from "./loading_plant.json";
import gardeberAnimation from './gardener_animation.json'

/**
 * 
 * @param {boolean} open
 * @param {React.Dispatch<React.SetStateAction<boolean>>} changeOpenState
 * @param {object} component
 * @returns {JSX.Element}
 */
const ChatDialog = ({open, changeOpenState, component}) => {
  
  const [messageInput, setMessageInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [events, setEvents] = useState([])
  const [connectionIsOpen, setConnectionIsOpen] = useState(false)
 
  const pathItemsStr = localStorage.getItem(PATH_KEY)
  const pathItems = pathItemsStr ? JSON.parse(pathItemsStr) : [{name: component.name, version: component.version}]
  const pathPosStr = localStorage.getItem(PATH_POS_KEY)
  const pathPos = pathPosStr ? parseInt(pathPosStr) : 0

  const sendQestion = async () => {
    try{
      await aiAssistant.chat.ask({
        question: removeBetweenMarkers(messageInput, '!#RS#!', '!#RE#!'),
        chat: chatMessages,
        setEvents: setEvents,
        setConnectionIsOpen: setConnectionIsOpen,
        rootComponentName:  pathItems[0]['name'],
        rootComponentVersion:  pathItems[0]['version'],
        currentComponentName:  pathItems[pathPos]['name'],
        currentComponentVersion:  pathItems[pathPos]['version'],
      })
    } catch(e) {
      setConnectionIsOpen(false)
      console.log(e)
    }
  }

  const componentNamesCompletionData = [
    {id: 'github.com/gardener/gardener version "v1.97.2"', display: 'gardener:v1.97.2'},
    {id: 'github.com/gardener/gardener version "v1.95.1"', display: 'gardener:v1.95.1'},
    {id: 'github.com/gardener/dashboard', display: 'dashboard'},
    {id: 'github.com/gardenlinux/gardenlinux', display: 'gardenlinux'},
    {id: 'github.wdf.sap.corp/kubernetes/landscape-setup', display: 'landscape-setup'},
    {id: 'github.com/gardener/cc-utils', display: 'cc-utils'},
    {id: 'github.wdf.sap.corp/kubernetes/landscape-setup-dependencies', display: 'landscape-setup-dependencies'}
  ]

  useEffect(()=>{
    const lastEvent = events[events.length - 1]
    if(lastEvent && lastEvent['end']){
      setChatMessages([
        ...chatMessages,
        {'type': 'human', 'content': removeBetweenMarkers(messageInput, '!#RS#!', '!#RE#!')},
        {'type': 'ai', 'content': lastEvent['answer']}
      ])
    }
  }, [events])

  useEffect(()=>{
    console.log(chatMessages)
  }, [chatMessages])

  return <Dialog
    open={open}
    onClose={()=>changeOpenState()}
    fullWidth={true}
    maxWidth='lg'
    sx={{
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: '10',
      }}
    >
      <DialogTitle sx={{height: '5rem !important'}}>Chat with your OCM</DialogTitle>
      <Box
        sx={{
          height: 'calc(100% - 10rem)',
          flex: '1',
          marginRight: '2rem',
          marginLeft: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          gap: '2rem',
          overflowY: 'scroll',
          scrollbarWidth: 'none',
        }}
      >
        {
          chatMessages.map((chatMessage, index) => {
            return <div 
              key={index} 
              style={{
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: chatMessage.type == 'ai' ? 'start' : 'end'
              }}
            >
              <Paper
                style={{
                  padding: '10px 20px', 
                  margin: '10px', 
                  maxWidth: '75%', 
                  backgroundColor: chatMessage.type === 'human' ? 'primary' : 'secondary'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  {chatMessage.type}
                </Typography>
                <Markdown remarkPlugins={[remarkGfm]}>{chatMessage.content}</Markdown>
              </Paper>
            </div>
          })
        }
        {
          connectionIsOpen && events.length > 0  
            ? <>
              <Box 
                display='flex'
                flexDirection='column'
                justifyContent='center'
                alignItems='center'
                width='100%'
              >
                <Lottie 
                  animationData={
                    events[events.length - 1]['nextStep'] == 'Creating a step by step Plan.' ? loadingPlant : gardeberAnimation
                  }
                  loop={true} 
                  style={{height: '5rem'}} 
                />
                {
                  //events[events.length - 1]['nextStep']
                }
              </Box>
              <br/>
            </>
            : <></>
        }
      </Box>
      <Box
        sx={{
          height: '5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
            width: '100%'
          }}
        >
          <MentionsInput 
            value={messageInput} 
            onChange={(event)=>setMessageInput(event.target.value)}
            placeholder={'Mention components using \'@\''}
            forceSuggestionsAboveCursor
            style={darkModeStyles}
            disabled={connectionIsOpen}
          >
            <Mention
              markup="!#RS#!@!#RE#!__id__!#RS#![__display__]!#RE#!"
              trigger="@"
              data={componentNamesCompletionData}
              renderSuggestion={(
                suggestion,
                search,
                highlightedDisplay,
                index,
                focused
              ) => (
                <div className={`user ${focused ? 'focused' : ''}`}>
                  {highlightedDisplay}
                </div>
              )}
              style={{ backgroundColor: '#ffffff' }}
            />
            {/* <Mention
              trigger="#"
              data={this.requestTag}
              renderSuggestion={this.renderTagSuggestion}
            /> */}
          </MentionsInput>
          <Button
            onClick={async ()=>{
              await sendQestion()
            }}
            disabled={connectionIsOpen}
            sx={{
              width: '3rem',
            }}
            variant='contained'
            color='secondary'
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  </Dialog>
}
ChatDialog.displayName = 'ChatDialog'
ChatDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  changeOpenState: PropTypes.func.isRequired,
  component: PropTypes.object.isRequired,
}

export default ChatDialog
