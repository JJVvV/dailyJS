import * as React from 'react'
import { connect } from 'react-redux'
import { ApplicationState, ConnectedReduxProps } from '../store'

interface ChatWindowProps extends ConnectedReduxProps<any> {}

type AllProps = ChatWindowProps & ReturnType<typeof mapStateToProps>

const ChatWindow: React.SFC<AllProps> = (props) => {
  console.log(props.messages)
  return <div />
}

const mapStateToProps = (state: ApplicationState) => state.chat

export default connect(mapStateToProps)(ChatWindow)
