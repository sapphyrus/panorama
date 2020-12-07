'use strict';

var mainmenu_watch = ( function()
{

	var _m_bPerfectWorld = ( MyPersonaAPI.GetLauncherType() === 'perfectworld' );
	var _m_activeTab;
	var _m_contextTab;                                                                                                               
	var _m_tabStack = [];
	var _m_contextPanel;
	var _m_myXuid = MyPersonaAPI.GetXuid();
	var MATCHLISTDESCRIPTOR = {
		"JsLive": "live",
		"JsYourMatches": _m_myXuid,
		"JsDownloaded": "downloaded"
	};
	var MATCHLISTTABBYNAME = {
		"live": "JsLive",
		                                                                
		"downloaded": "JsDownloaded"
	};
	MATCHLISTTABBYNAME[ _m_myXuid ] = "JsYourMatches";


	                                                                                                                                                                     
	          
	                                                                                                                                                                     

	function _PopulateStreamList ( parentPanel )
	{

		                           
		var streamNum = StreamsAPI.GetStreamCount();
		var count = 9;
		if ( streamNum < 9 )
		{
			count = streamNum;
		}

		var elStreamList = parentPanel.FindChildTraverse( "JsStreamList" );

		for ( var i = 0; i < elStreamList.GetChildCount(); i++ )
		{
			elStreamList.GetChild( i ).markForDelete = true;
		}

		if ( count === 0 )
		{
			matchList.ShowListSpinner( false, parentPanel );
			matchList.SetListMessage( $.Localize( "#CSGO_Watch_NoSteams" ), true, parentPanel );
			matchList.ShowInfoPanel( false, parentPanel );
		}
		else
		{
			matchList.SetListMessage( "", false, parentPanel );
			matchList.ShowInfoPanel( true, parentPanel );
		}

		function _SendToTwitch ( streamId )
		{
			var url = StreamsAPI.GetStreamVideoFeedByName( streamId );
			SteamOverlayAPI.OpenExternalBrowserURL( url );
		}

		function _ClearList ( elListPanel )
		{
			var activeTiles = elListPanel.Children();
			for ( var i = activeTiles.length - 1; i >= 0; i-- )
			{
				if ( activeTiles[ i ].markForDelete )
				{
					if ( elListPanel.activeButton === activeTiles[ i ] )
					{
						elListPanel.activeButton = undefined;
					}
					activeTiles[ i ].checked = false;
					watchTile.Delete( activeTiles[ i ] );
				}
			}
		}

		for ( var i = 0; i < count; i++ )
		{
			var streamName = StreamsAPI.GetStreamNameByIndex( i );
			var elStreamPanel = elStreamList.FindChildInLayoutFile( "TwitchStream_" + streamName );
			if ( elStreamPanel == undefined )
			{
				var elStreamPanel = $.CreatePanel( 'Button', elStreamList, "TwitchStream_" + streamName );
				var streamCountry = StreamsAPI.GetStreamCountryByName( streamName );
				elStreamPanel.BLoadLayout( "file://{resources}/layout/matchtiles/streams.xml", false, false );
				var elStreamText = elStreamPanel.FindChildTraverse( 'Text-Panel' );

				elStreamPanel.FindChildInLayoutFile( 'stream-button__blur-target' ).AddBlurPanel( elStreamText );

				                        
				elStreamPanel.SetDialogVariable( 'streamText', StreamsAPI.GetStreamTextDescriptionByName( streamName ) );
				elStreamPanel.SetDialogVariable( "numberOfViewers", StreamsAPI.GetStreamViewersByName( streamName ) );
				elStreamPanel.SetDialogVariable( "channel", StreamsAPI.GetStreamDisplayNameByName( streamName ) );

				elStreamPanel.FindChildTraverse( "TwitchThumb" ).SetImage( StreamsAPI.GetStreamPreviewImageByName( streamName ) );
				elStreamPanel.FindChildTraverse( "flag" ).SetImage( "file://{images}/flags/" + streamCountry + ".png" );

				elStreamPanel.SetPanelEvent( 'onactivate', _SendToTwitch.bind( undefined, streamName ) );
			}
			elStreamPanel.markForDelete = false;
		}

		_ClearList( parentPanel.FindChildTraverse( "JsStreamList" ) );
	}

	                                                                                                                                                                     
	              
	                                                                                                                                                                     

	function _PopulateTournamentPage ( parentPanel )
	{

		var elTournamentList = parentPanel.FindChildTraverse( "JsTournamentList" );

		if ( !elTournamentList.FindChildTraverse( "other-tournaments" ) )
		{

			                                  
			elTournamentList.BLoadLayout( "file://{resources}/layout/matchtiles/tournament_page.xml", false, false );
			var pastTournamentPanel = elTournamentList.FindChildTraverse( "other-tournaments" );

			                                                                                                                      
			                                                          
			      

			                                                                             
			var maxTournaments = g_ActiveTournamentInfo.eventid;
			      

			for ( var i = maxTournaments; i >= 1; i-- )
			{
				if ( i == 2 ) continue;
				                                         
				var elTournamentPanel = $.CreatePanel( 'Button', pastTournamentPanel, "Tournament_" + i );
				             
				elTournamentPanel.BLoadLayoutSnippet( "tournament_tile" );

				elTournamentPanel.FindChildTraverse( 'title' ).SetLocalizationString( '#CSGO_Tournament_Event_Location_' + i );

				var iconSource = 'file://{images}/tournaments/events/tournament_logo_' + i + '.svg';

				$.CreatePanel( 'Image', elTournamentPanel.FindChildTraverse( 'blur-backing' ), 'id-tournament-logo--large', {
					src: iconSource,
					texturewidth: 32,
					textureheight: 32,
					class: "tournament-logo--large"
				} );

				$.CreatePanel( 'Image', elTournamentPanel.FindChildTraverse( 'image-container' ), 'id-tournament-logo--small', {
					src: iconSource,
					texturewidth: 100,
					textureheight: 100,
					class: "tournament-logo--small"
				} );

				                                       

				function _Populate( elPanel, oData, eventid )
				{				
					var team = oData[ 'team_id' ];
					var teamTag = oData[ 'tag' ];
					var teamGeo = oData[ 'geo' ];
					var teamLogo = 'file://{images}/tournaments/teams/' + teamTag.toLowerCase() + '.svg'
					var teamName = $.Localize( 'CSGO_TeamID_' + team );

					            
					elPanel.SetDialogVariable( 'eventsched-tt-teamname', teamName );
					
					            
					var elTeamLogo = elPanel.FindChildTraverse( 'id-estt-header__team-logo' );
					if ( elTeamLogo )
					{
						elTeamLogo.SetImage( teamLogo );
					}

					var elTeamLogoBlurBG = elPanel.FindChildTraverse( 'id-estt-blur' );
					if ( elTeamLogoBlurBG )
					{
						elTeamLogoBlurBG.SetImage( teamLogo );
					}
			
					var elPlayerContainer = elPanel.FindChildTraverse( 'id-estt-lineup-container' );

					          
					var playerIndex = 0;

					                  
					var arrIndices = [ 0, 1, 2, 3, 4 ];
					for ( var i = 0; i < 5; i++ )
					{
						var n = arrIndices.splice( Math.floor( Math.random() * 5 ), 1 )[ 0 ];
						arrIndices.push( n );
					}

					var arrTeamPlayers = Object.entries( oWinningTeam[ 'players' ] );

					arrIndices.forEach( function( i )
					{
						var oPlayer = arrTeamPlayers[ i ][ 1 ];                                                    
						var elPlayer = $.CreatePanel( 'Panel', elPlayerContainer, oPlayer[ 'name' ] );
						elPlayer.BLoadLayoutSnippet( 'snippet-estt-player' );
						elPlayer.AddClass( 'player' + playerIndex );
			
						var playerName = oPlayer[ 'name' ];
						              
						elPlayer.SetDialogVariable( 'esttplayer-name', playerName );

  						                                                                     
			
						              
						var elPlayerImage = elPlayer.FindChildTraverse( 'id-estt-player__photo' );
						if ( elPlayerImage )
						{
							var photo_url = "file://{images}/tournaments/avatars/" + eventid + "/" + oPlayer[ 'accountid64' ] + ".png";
							elPlayerImage.SetImage( photo_url );
						}

						playerIndex++;
					} );
				}

				var ProEventJSO = TournamentsAPI.GetProEventDataJSO( i, 1 );                                 

				if( ProEventJSO )
				{
					var elChampionsRoot = elTournamentPanel.FindChildInLayoutFile( 'id-champions-frame' );
					var oWinningTeam = ProEventJSO[ 'eventdata' ][ i ][ 1 ];

					_Populate( elChampionsRoot, oWinningTeam, i );

					elTournamentPanel.FindChildTraverse('individual-tournaments').SetPanelEvent( 'onmouseover', function( elPanel ) {elPanel.AddClass( 'hover' );}.bind( undefined, elChampionsRoot ) );
					elTournamentPanel.FindChildTraverse('individual-tournaments').SetPanelEvent( 'onmouseout', function( elPanel ) {elPanel.RemoveClass( 'hover' );}.bind( undefined, elChampionsRoot ) );
				}

				elTournamentPanel.SetPanelEvent( 'onactivate', _NavigateToTab.bind( undefined, 'JsMainMenuSubContent_Tournament' + i, 'mainmenu_watch_tournament', 'tournament:' + i, true, true ) );
			}
		}
	}

	                                                                                                                                                                     
	                           
	                                                                                                                                                                     

	function _UpdateTab ( elTab, optbFromMatchListChangeEvent )
	{
		elTab.SetReadyForDisplay( true );
		elTab.visible = true;

		switch ( elTab.id )
		{
			case "JsStreams":
				StreamsAPI.Refresh();
				_PopulateStreamList( elTab );
				break;
			case "JsTournaments":
				_PopulateTournamentPage( elTab );
				break;
			case "JsActiveTournament":
				$.DispatchEvent( 'InitializeTournamentsPage', elTab, 'tournament:' + g_ActiveTournamentInfo.eventid );
				break;
			case "JsYourMatches":
			case "JsDownloaded":
			case "JsLive":
				matchList.UpdateMatchList( elTab, MATCHLISTDESCRIPTOR[ elTab.id ], optbFromMatchListChangeEvent );
				if ( _m_activeTab.activeMatchInfoPanel )
				{
					matchInfo.ResizeRoundStatBars( _m_activeTab.activeMatchInfoPanel );
				}
				break;
			case "JsEvents":
				TournamentsAPI.RequestTournaments();
				break;
		}

		                                   
		                                   
		 
			                                                                 
			                                                                         

			                                                                        
			 
				                                               
				                                         
				                                             
				                                      
			 
			                                                                          
			 
				                                    

				                          
				 
					                                          
					                                                                     
					       
				 
				
				                                                  
			 
			       
		   

	}

	function _UpdateActiveTab ()
	{
		if ( _m_activeTab )
		{
			if ( _m_activeTab.id === 'JsActiveTournament' )
			{
				$.DispatchEvent( 'RefreshPickemPage', 'tournament:' + g_ActiveTournamentInfo.eventid );
				return;
			}

			_UpdateTab( _m_activeTab );
		}
	}

	function _UpdateMatchList ( listId, optbFromMatchListChangeEvent )
	{
		                                                  
		var tabbyid = MATCHLISTTABBYNAME[ listId ];
		if ( tabbyid )
		{
			                                                          
			_UpdateTab( $( "#" + tabbyid ), optbFromMatchListChangeEvent );
		}
	}
	function _UpdateMatchListFromMatchListChangeEvent ( listId )
	{
		_UpdateMatchList( listId, true );
	}

	function _NavigateToTab ( tab, xmlName, tournament_id = undefined, isSubTab = false, addToStack = false )
	{
		                               

		StoreAPI.RecordUIEvent( "WatchMenuTab_" + tab );

		                                                                                                                   

		                         
		if ( isSubTab && addToStack )
		{
			                                                                                 
			if ( _m_tabStack.length > 0 )
			{
				_m_tabStack[ _m_tabStack.length - 1 ].AddClass( "mainmenu-content--hidden" );
			}
			else
			{
				if ( !_m_contextPanel )
				{
					_m_contextPanel = $( "#main-content" );
				}
				if ( _m_contextPanel )
				{
					_m_contextPanel.AddClass( "mainmenu-content--hidden" );
				}
			}
		}

		                                                       
		var parent;
		if ( isSubTab && !$.GetContextPanel().FindChildInLayoutFile( tab ) )
		{
			                              
			var newPanel = undefined;

			parent = $.CreatePanel( 'Panel', $( '#JsWatchContent' ), tab );
			parent.AddClass( "mainmenu-content--popuptab" );
			parent.AddClass( "mainmenu-content--hidden" );
			parent.AddClass( "mainmenu-content__container" );
			parent.AddClass( "no-margin" );
			parent.AddClass( 'hide' );
			newPanel = $.CreatePanel( 'Panel', parent, "tournament_content_" + tournament_id );
			newPanel.Data().elMainMenuRoot = $.GetContextPanel().Data().elMainMenuRoot;
			parent.RemoveClass( 'hide' );
			parent.RemoveClass( 'mainmenu-content--hidden' );
			parent.tournament_id = tournament_id;

			newPanel.BLoadLayout( 'file://{resources}/layout/' + xmlName + '.xml', false, false );
			newPanel.RegisterForReadyEvents( true );
			parent.isSubTab = true;

			                                                                          
			                                                       
			_InitResourceManagement( newPanel );
			$.DispatchEvent( 'InitializeTournamentsPage', newPanel, tournament_id );
		}

		var pressedTab = $( '#' + tab );

		if ( _m_activeTab != pressedTab )
		{
			if ( !isSubTab ) 
			{
				if ( _m_activeTab )
				{
					if ( !_m_activeTab.isSubTab )
					{
						_m_activeTab.AddClass( 'WatchMenu--Hide' );
					}
					else
					{
						_m_activeTab.AddClass( 'mainmenu-content--hidden' );
					}
				}

				_m_activeTab = pressedTab;
				_m_contextTab = pressedTab;
				if ( !_m_contextPanel )
				{
					_m_contextPanel = $( "#main-content" );
				}
				if ( _m_contextPanel )
				{
					_m_contextPanel.RemoveClass( "mainmenu-content--hidden" );
				}

				if ( !_m_activeTab )
				{
					                                                 
					return;
				}
				_m_activeTab.RemoveClass( 'WatchMenu--Hide' );
			}
			else
			{
				if ( !addToStack ) _m_activeTab.AddClass( 'mainmenu-content--hidden' );
				_m_activeTab = pressedTab;
				_m_activeTab.SetFocus();

				if ( !_m_activeTab )
				{
					                                                 
					return;
				}
				_m_activeTab.RemoveClass( 'mainmenu-content--hidden' );
				if ( _m_activeTab.tournament_id )
				{
					matchList.ReselectActiveTile( _m_activeTab );
				}
				if ( addToStack ) _m_tabStack.push( _m_activeTab );
			}
		}

		                                                                      
		_UpdateTab( _m_activeTab );
	}

	function _CloseSubMenuContent () 
	{
		if ( ( !_m_tabStack ) || ( _m_tabStack.length == 0 ) || ( !_m_tabStack[ _m_tabStack.length - 1 ].visible ) )
		{
			return false;
		}
		_m_tabStack.pop();
		                                                               
		if ( _m_tabStack.length >= 1 )
		{
			_NavigateToTab( _m_tabStack[ _m_tabStack.length - 1 ].id, undefined, true, false );
		}
		                                                                         
		else
		{
			_NavigateToTab( _m_contextTab.id );
		}
		return true;
	}

	function _InitResourceManagement ( elTab )
	{
		elTab.OnPropertyTransitionEndEvent = function( panelName, propertyName )
		{
			if ( elTab.id === panelName && propertyName === 'opacity' )
			{
				                                         
				if ( elTab.visible === true && elTab.BIsTransparent() )
				{
					                                               
					elTab.visible = false;
					elTab.SetReadyForDisplay( false );
					return true;
				}
			}

			return false;
		}

		$.RegisterEventHandler( 'PropertyTransitionEnd', elTab, elTab.OnPropertyTransitionEndEvent );
		elTab.Data().elMainMenuRoot = $.GetContextPanel().Data().elMainMenuRoot;
	}

	function _InitTab ( tab )
	{
		var elTab = $( '#' + tab );
		if ( !elTab.BLoadLayoutSnippet( "MatchListAndInfo" ) )
		{
			                                                                                                                                        
		}

		_InitResourceManagement( elTab );
	}

	function _Refresh ( tabid )
	{
		if ( tabid === 'JsWatch' )
		{
			if ( _m_activeTab )
			{
				if ( _m_activeTab.activeMatchInfoPanel )
				{
					matchInfo.ResizeRoundStatBars( _m_activeTab.activeMatchInfoPanel );
				}
			}
		}
	}


	                                                                                                                                                                     
	                     
	                                                                                                                                                                     

	function _InitMainWatchPanel ()
	{
		_m_activeTab = undefined;
		_m_contextPanel = $( "#main-content" );
		$.RegisterForUnhandledEvent( "PanoramaComponent_MatchList_StateChange", _UpdateMatchListFromMatchListChangeEvent );
		$.RegisterForUnhandledEvent( "CloseSubMenuContent", _CloseSubMenuContent );
		$.RegisterForUnhandledEvent( "NavigateToTab", _NavigateToTab );
		$.RegisterForUnhandledEvent( "MainMenuTabShown", _Refresh );
		_InitTab( 'JsYourMatches' );
		_InitTab( 'JsDownloaded' )
		_InitTab( 'JsLive' );
		_InitResourceManagement( $( '#JsTournaments' ) );

		$.GetContextPanel().Data().elMainMenuRoot;

		_InitResourceManagement( $( '#JsStreams' ) );
		_InitResourceManagement( $( '#JsEvents' ) );

		var restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
		if ( restrictions === false )
		{
			                                                                                       
			if ( false )
			{
				_InitResourceManagement( $( '#JsActiveTournament' ) );
				_NavigateToTab( 'JsActiveTournament' );
				$( '#WatchNavBarActiveTourament' ).checked = true;

				return;
			}
		}


		                                                                          
		_NavigateToTab( 'JsLive' );
		$( '#WatchNavBarButtonLive' ).checked = true;

		                                                                            
		                                
		                                                  
	}

	var _RunEveryTimeWatchIsShown = function()
	{
		                                                                                               
		                                                                                             
		                               

		if ( !MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC() )
		{
			                                       
			UiToolkitAPI.ShowGenericPopupOk(
				$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
				$.Localize( '#SFUI_Steam_Error_LinkUnexpected' ),
				'',
				function()
				{
					$.DispatchEvent( 'HideContentPanel' );
				},
				function()
				{
				}
			);
		}
	};

	var _OnReadyForDisplay = function()
	{
	};

	var _ShowActiveTournamentPage = function( idOfTab = '' )
	{
		_NavigateToTab( 'JsActiveTournament' );

		var elTournamentActive = $( '#JsActiveTournament' );

		if ( idOfTab )
		{
			$.DispatchEvent( "Activated", elTournamentActive.FindChildInLayoutFile( idOfTab ), "mouse" );
		}
	}


	                      
	return {
		NavigateToTab: _NavigateToTab,                        
		UpdateActiveTab: _UpdateActiveTab,
		                                               
		InitMainWatchPanel: _InitMainWatchPanel,
		CloseSubMenuContent: _CloseSubMenuContent,
		OnReadyForDisplay: _OnReadyForDisplay,
		ShowActiveTournamentPage: _ShowActiveTournamentPage
	};

} )();

                                                                                                    
                                           
                                                                                                    
( function()
{
	$.RegisterEventHandler( 'Cancelled', $( '#JsWatch' ), mainmenu_watch.CloseSubMenuContent );
	$.RegisterEventHandler( 'ReadyForDisplay', $( '#JsWatch' ), mainmenu_watch.OnReadyForDisplay );
	$.RegisterForUnhandledEvent( 'ShowActiveTournamentPage', mainmenu_watch.ShowActiveTournamentPage );
} )();


	      
	                                                                           
	  
	                              
	  
	                
	                                                 
