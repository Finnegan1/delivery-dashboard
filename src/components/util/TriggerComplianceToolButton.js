import React from 'react'
import PropTypes from 'prop-types'

import {
  Avatar,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'

import {
  TOKEN_KEY,
  copyNotificationCfg,
  errorSnackbarProps,
} from './../../consts'
import { serviceExtensions } from './../../api'
import {
  camelCaseToDisplayText,
  isTokenExpired,
  normaliseObject,
} from './../../util'


export const triggerComplianceTool = ({
  service,
  cfgName,
  ocmNodes,
  enqueueSnackbar,
  priority,
  setIsLoading,
}) => {
  const fetchBacklogItems = async ({artefacts}) => {
    const artefactPhrase = artefacts.length === 1 ?
      `${artefacts[0].artefact.artefact_name}:${artefacts[0].artefact.artefact_version}` :
      `${ocmNodes.length} artefacts`
    if (setIsLoading) {
      setIsLoading(true)
    }
    try {
      await serviceExtensions.backlogItems.create({
        service: service,
        cfgName: cfgName,
        priority: priority ? priority : 'Critical',
        artefacts: artefacts,
      })
    } catch(error) {
      enqueueSnackbar(
        `Could not schedule ${artefactPhrase} for ${camelCaseToDisplayText(service).toLowerCase()}`,
        {
          ...errorSnackbarProps,
          details: error.toString(),
          onRetry: () => fetchBacklogItems({artefacts}),
        },
      )
      if (setIsLoading) {
        setIsLoading(false)
      }
      return false
    }

    enqueueSnackbar(
      `Successfully scheduled ${artefactPhrase} for ${camelCaseToDisplayText(service).toLowerCase()}`,
      {
        variant: 'success',
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
        autoHideDuration: 6000,
      },
    )
    if (setIsLoading) {
      setIsLoading(false)
    }
    return true
  }

  const token = JSON.parse(localStorage.getItem(TOKEN_KEY))
  if (!token) {
    enqueueSnackbar('You need to login first', {
      ...copyNotificationCfg,
    })
    return false
  } else if (isTokenExpired(token)) {
    enqueueSnackbar('Session expired, please login again', {
      ...copyNotificationCfg,
    })
    localStorage.removeItem(TOKEN_KEY)
    return false
  }

  const artefacts = ocmNodes.map((ocmNode) => {
    return {
      component_name: ocmNode.component.name,
      component_version: ocmNode.component.version,
      artefact_kind: ocmNode.artefactKind,
      artefact: {
        artefact_name: ocmNode.artefact.name,
        artefact_version: ocmNode.artefact.version,
        artefact_type: ocmNode.artefact.type,
        artefact_extra_id: ocmNode.artefact.extraIdentity,
      },
    }
  }).filter((ocmNode, idx, nodes) => {
    // don't create multiple backlog items which have the same purpose
    // e.g. for the issue replicator, we group issues across versions
    // so a backlog item for one version is enough
    // -> use the node with the first occurrence/idx
    return nodes.findIndex((node) => {
      if (service === 'bdba') {
        return JSON.stringify(normaliseObject(ocmNode)) === JSON.stringify(normaliseObject(node))
      }
      if (service === 'issueReplicator') {
        return (
          ocmNode.artefact_kind == node.artefact_kind &&
          ocmNode.component_name == node.component_name &&
          ocmNode.artefact.artefact_name == node.artefact.artefact_name &&
          ocmNode.artefact.artefact_type == node.artefact.artefact_type &&
          JSON.stringify(normaliseObject(ocmNode.artefact.artefact_extra_id))
            === JSON.stringify(normaliseObject(node.artefact.artefact_extra_id))
        )
      }
    }) === idx
  })

  return fetchBacklogItems({artefacts})
}
triggerComplianceTool.propTypes = {
  service: PropTypes.string.isRequired,
  cfgName: PropTypes.string.isRequired,
  ocmNodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  priority: PropTypes.string,
  setIsLoading: PropTypes.func,
}


const TriggerComplianceToolButton = ({
  ocmNode,
  cfgName,
  service,
}) => {
  const { enqueueSnackbar } = useSnackbar()

  return <ListItemButton
    onClick={(e) => {
      e.stopPropagation()
      triggerComplianceTool({
        service: service,
        cfgName: cfgName,
        ocmNodes: [ocmNode],
        enqueueSnackbar: enqueueSnackbar,
      })
    }}
    divider
  >
    <ListItemAvatar>
      <Avatar>
        <PublishedWithChangesIcon/>
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary={`Trigger ${camelCaseToDisplayText(service)} Scan`}/>
  </ListItemButton>
}
TriggerComplianceToolButton.displayName = 'TriggerComplianceToolButton'
TriggerComplianceToolButton.propTypes = {
  ocmNode: PropTypes.object.isRequired,
  cfgName: PropTypes.string.isRequired,
  service: PropTypes.string.isRequired,
}


export default TriggerComplianceToolButton
