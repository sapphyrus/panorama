'use strict';


var PopupAcceptMatch = ( function(){

	var m_hasPressedAccept = false;
	var m_numPlayersReady = 0;
	var m_numTotalClientsInReservation = 0;
	var m_numSecondsRemaining = 0;
	var m_isReconnect= false;
	var m_isNqmmAnnouncementOnly = false;
	var m_lobbySettings;
	var m_elTimer = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchCountdown' );
	var m_jsTimerUpdateHandle = false;
	
	var _Init = function ()
	{
		               
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchSlots' );
		elPlayerSlots.RemoveAndDeleteChildren();
		
		var settings = $.GetContextPanel().GetAttributeString( 'map_and_isreconnect', '' );

		                                           
		var settingsList = settings.split(',');

		var map = settingsList[0];
		if ( map.charAt( 0 ) === '@' )
		{
			m_isNqmmAnnouncementOnly = true;
			m_hasPressedAccept = true;
			map = map.substr( 1 );
		}
		
		                                                             
		m_isReconnect = settingsList[1] === 'true' ? true : false;
		m_lobbySettings = LobbyAPI.GetSessionSettings().game;

		$.DispatchEvent( "ShowReadyUpPanel", "" );

		
		_SetMatchData( map );

		if ( m_isNqmmAnnouncementOnly )
		{
			$( '#AcceptMatchDataContainer' ).SetHasClass( 'auto', true );
			_UpdateUiState();
			m_jsTimerUpdateHandle = $.Schedule( 1.9, _OnNqmmAutoReadyUp );
		}
	}

	var _UpdateUiState = function()
	{
		var btnAccept = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchBtn' );
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchSlots' );

		var bHideTimer = false;
		var bShowPlayerSlots = m_hasPressedAccept || m_isReconnect;
		if ( m_isNqmmAnnouncementOnly )
		{
			bShowPlayerSlots = false;
			bHideTimer = true;
		}
		
		btnAccept.SetHasClass( 'hidden', m_hasPressedAccept || m_isReconnect );
		elPlayerSlots.SetHasClass( 'hidden', !bShowPlayerSlots );

		if ( bShowPlayerSlots )
		{
			_UpdatePlayerSlots( elPlayerSlots );
			bHideTimer = true;
		}

		m_elTimer.GetChild(0).text = "0:"+( (m_numSecondsRemaining<10) ? "0":"")+m_numSecondsRemaining;
		m_elTimer.SetHasClass( "hidden", bHideTimer || ( m_numSecondsRemaining <= 0 ) );

		if( m_jsTimerUpdateHandle )
		{
			$.CancelScheduled( m_jsTimerUpdateHandle );
			m_jsTimerUpdateHandle = false;
		}
	}

	var _OnTimerUpdate = function()
	{
		m_jsTimerUpdateHandle = false;
		
		m_numSecondsRemaining = LobbyAPI.GetReadyTimeRemainingSeconds();
		_UpdateUiState();

		if ( m_numSecondsRemaining > 0 )
		{
			if ( m_hasPressedAccept )
			{
				$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_waitquiet', 'MOUSE' );
			}
			else
			{
				$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_beep', 'MOUSE' );
			}
			m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
		}
	}

	var _ReadyForMatch = function ( shouldShow, playersReadyCount, numTotalClientsInReservation )
	{
		                                                             		
		                                                
		if( !shouldShow )
		{
			if( m_jsTimerUpdateHandle )
			{
				$.CancelScheduled( m_jsTimerUpdateHandle );
				m_jsTimerUpdateHandle = false;
			}

			$.DispatchEvent( "CloseAcceptPopup" );
			$.DispatchEvent( 'UIPopupButtonClicked', '' );
			return;
		}

		if ( m_hasPressedAccept && m_numPlayersReady && ( playersReadyCount > m_numPlayersReady ) )
		{
			                                                                                               
			$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
		}

		if ( playersReadyCount == 1 && numTotalClientsInReservation == 1 && ( m_numTotalClientsInReservation > 1 ) )
		{	                                                                                 
			                                                                          
			numTotalClientsInReservation = m_numTotalClientsInReservation;
			playersReadyCount = m_numTotalClientsInReservation;
		}
		m_numPlayersReady = playersReadyCount;
		m_numTotalClientsInReservation = numTotalClientsInReservation;
		m_numSecondsRemaining = LobbyAPI.GetReadyTimeRemainingSeconds();
		_UpdateUiState();

		m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
	}

	var _UpdatePlayerSlots = function ( elPlayerSlots )
	{
		for( var i = 0; i < m_numTotalClientsInReservation; i++ )
		{
			var Slot = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchSlot' + i );

			if( !Slot )
			{
				Slot = $.CreatePanel( 'Panel', elPlayerSlots, 'AcceptMatchSlot' + i );
				Slot.BLoadLayoutSnippet( 'AcceptMatchPlayerSlot' );
			}

			Slot.SetHasClass ( 'accept-match__slots__player--accepted', ( i < m_numPlayersReady ) );
		}

		var labelPlayersAccepted = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchPlayersAccepted' );
		labelPlayersAccepted.SetDialogVariableInt( 'accepted', m_numPlayersReady );
		labelPlayersAccepted.SetDialogVariableInt( 'slots', m_numTotalClientsInReservation );
		labelPlayersAccepted.text = $.Localize( '#match_ready_players_accepted', labelPlayersAccepted );
	}

	                                                                                             
	var _SetMatchData = function ( map )
	{
		if ( m_lobbySettings === undefined )
			return;

		var labelData = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchModeMap' );
		var strLocalize = '#match_ready_match_data';

		                                                                                                                                                 
		
		var mode = $.Localize ( '#SFUI_GameMode_' + m_lobbySettings.mode );
		labelData.SetDialogVariable ( 'mode', mode );

		if ( ( m_lobbySettings.mode === 'competitive' ) &&
			( GameTypesAPI.GetMapGroupAttribute( 'mg_'+map, 'competitivemod' ) === 'unranked' ) )
		{
			labelData.SetDialogVariable ( 'mode', $.Localize( '#SFUI_RankType_Modifier_Unranked' ) );
			                                                                                                
			                                                    
			$.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchWarning' ).RemoveClass( 'hidden' );
		}

		if ( ( m_lobbySettings.mode === 'competitive' ) && ( map === 'lobby_mapveto' ) )
		{
			strLocalize = '#match_ready_match_data_map';
			$('#AcceptMatchModeIcon').SetImage( "file://{images}/icons/ui/competitive_teams.svg" );
		}

		labelData.SetDialogVariable ( 'map', $.Localize ( '#SFUI_Map_' + map ));
		labelData.text = $.Localize( strLocalize, labelData );

		var imgMap = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchMapImage' );		
		imgMap.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + map + '.png")';
	}

	var _OnNqmmAutoReadyUp = function ()
	{
		m_jsTimerUpdateHandle = false;
		$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_confirmed', 'MOUSE' );
		LobbyAPI.SetLocalPlayerReady( 'deferred' );
		$.DispatchEvent( "CloseAcceptPopup" );
		$.DispatchEvent( 'UIPopupButtonClicked', '' );
	}

	var _OnAcceptMatchPressed = function ()
	{
		m_hasPressedAccept = true;
		$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
		LobbyAPI.SetLocalPlayerReady( 'accept' );
	}

	return {
		Init					: _Init,
		ReadyForMatch			: _ReadyForMatch,
		OnAcceptMatchPressed	: _OnAcceptMatchPressed
	}

})();

(function()
{
	
	  
	                                                                                                    
	                                                                                                          
	  
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Lobby_ReadyUpForMatch', PopupAcceptMatch.ReadyForMatch );
	$.RegisterForUnhandledEvent( 'MatchAssistedAccept', PopupAcceptMatch.OnAcceptMatchPressed );

	  
	           
	                                                                           
	                                                                          
	                                                                          
	                                                                          
	  
	
})();
