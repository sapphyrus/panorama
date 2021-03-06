'use strict';

var PlayMenu = ( function()
{
	var k_workshopPanelId = 'gameModeButtonContainer_workshop';

	                                                                   
	var m_mapSelectionButtonContainers = {};
	                                        
	var m_gameModeConfigs = {};
	                                                    
	var m_arrGameModeRadios = [];
	                                                
	var GetMGDetails;
	var GetGameType;

	var m_bPerfectWorld = ( MyPersonaAPI.GetLauncherType() === 'perfectworld' );
	var m_activeMapGroupSelectionPanelID = null;
	var m_permissions = '';

	                                              
	var m_serverSetting = '';
	var m_gameModeSetting = '';
	                                                                                                                                            

	                    
	var m_isWorkshop = false;

	var k_workshopModes = {
		classic: 'casual,competitive',

		casual: 'casual',
		competitive: 'competitive',
		wingman: 'scrimcomp2v2',
		deathmatch: 'deathmatch',
		training: 'training',
		coopstrike: 'coopmission',

		custom: 'custom',

		                 
		armsrace: 'armsrace',
		demolition: 'demolition',
		flyingscoutsman: 'flyingscoutsman'
	};

	var _Init = function()
	{
		                                                                                                     
		                         
		    
		   	                                                              
		   	                                                     
		   	                          
		   	 
		   		                                                    
		   	 
		    
		      

		                                                
		var cfg = GameTypesAPI.GetConfig();
		                                                                                                  
		                                                   
		for ( var type in cfg.gameTypes )
		{
			for ( var mode in cfg.gameTypes[ type ].gameModes )
			{
				m_gameModeConfigs[ mode ] = cfg.gameTypes[ type ].gameModes[ mode ];
			}
		}

		                                                                                  
		                                                                                                                                 
		GetGameType = function( mode )
		{
			for ( var gameType in cfg.gameTypes ) 
			{
				if ( cfg.gameTypes[ gameType ].gameModes.hasOwnProperty( mode ) )
					return gameType;
			}
		};

		GetMGDetails = function( mg )
		{
			return cfg.mapgroups[ mg ];
		};

		                                                                                                  
		                                                                
		                                                
		var elGameModeSelectionRadios = $( '#GameModeSelectionRadios' );
		m_arrGameModeRadios = elGameModeSelectionRadios.Children();
		m_arrGameModeRadios.forEach( function( entry )
		{
			entry.SetPanelEvent( 'onactivate', function()
			{
				m_isWorkshop = false;
				m_gameModeSetting = entry.id;
				_ApplySessionSettings();
			} );
		} );

		                      
		           
		                                           
		                                                        
		    
		   	                               
		   	                        
		       

		                         
		var elPermissionsButton = $( '#PermissionsSettings' );
		elPermissionsButton.SetPanelEvent( 'onactivate', function()
		{
			                                                                                                                                  
			var bCurrentlyPrivate = ( LobbyAPI.GetSessionSettings().system.access === "private" );
			var sNewAccessSetting = bCurrentlyPrivate ? "public" : "private";
			var settings = {
				update: {
					System: {
						access: sNewAccessSetting
					}
				}
			};
			GameInterfaceAPI.SetSettingString( 'lobby_default_privacy_bits', ( sNewAccessSetting === "public" ) ? "1" : "0" );
			LobbyAPI.UpdateSessionSettings( settings );
			$.DispatchEvent( 'UIPopupButtonClicked', '' );
		} );

		                           
		var btnStartSearch = $( '#StartMatchBtn' );
		btnStartSearch.SetPanelEvent( 'onactivate', function()
		{
			$.DispatchEvent( 'PlaySoundEffect', 'mainmenu_press_GO', 'MOUSE' );
			btnStartSearch.AddClass( 'pressed' );

			if ( m_isWorkshop )
				_DisplayWorkshopModePopup();
			else
			{
				LobbyAPI.StartMatchmaking(	MyPersonaAPI.GetMyOfficialTournamentName(),
											MyPersonaAPI.GetMyOfficialTeamName(),
											_GetTournamentOpponent(),
											_GetTournamentStage()
										 );
			}
		} );

		var btnCancel = $.GetContextPanel().FindChildInLayoutFile( 'PartyCancelBtn' );
		btnCancel.SetPanelEvent( 'onactivate', function()
		{
			LobbyAPI.StopMatchmaking();
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE' );
		});

		elPermissionsButton.SetPanelEvent( 'onmouseover', function()
		{
			UiToolkitAPI.ShowTextTooltip( 'PermissionsSettings', '#SFUI_Client_PermissionsTitle' );
		} );

		elPermissionsButton.SetPanelEvent( 'onmouseout', function()
		{
			UiToolkitAPI.HideTextTooltip();
		} );

		$( "#WorkshopSearchTextEntry" ).SetPanelEvent( 'ontextentrychange', _UpdateWorkshopMapFilter );

		                                            
		_SyncDialogsFromSessionSettings( LobbyAPI.GetSessionSettings() );
		_ApplySessionSettings();
	};

	var _IsGameModeAvailable = function( serverType, gameMode )
	{
		       
		if ( !_IsValveOfficialServer( serverType ) 
			&& gameMode === "survival" 
			)
		{
			return false;
		}
		       

		if ( gameMode === "cooperative" )
		{
			var questID = GetMatchmakingQuestId();
			return questID > 0 && MissionsAPI.GetQuestDefinitionField( questID, "gamemode" ) === "cooperative";
		}

		return true;
	}

	var _GetTournamentOpponent = function ()
	{
		var elTeamDropdown = $.GetContextPanel().FindChildInLayoutFile( 'TournamentTeamDropdown' );
		if ( elTeamDropdown.GetSelected() === null )
			return '';
		return elTeamDropdown.GetSelected().GetAttributeString( 'data', '' );
	}

	var _GetTournamentStage = function ()
	{
		var elStageDropdown = $.GetContextPanel().FindChildInLayoutFile( 'TournamentStageDropdown' );
		if ( elStageDropdown.GetSelected() === null )
			return '';
		return elStageDropdown.GetSelected().GetAttributeString( 'data', '' );
	}

	var _UpdateStartSearchBtn = function ( isSearchingForTournament )
	{
		var btnStartSearch = $.GetContextPanel().FindChildInLayoutFile( 'StartMatchBtn' );
		btnStartSearch.enabled = isSearchingForTournament ? ( _GetTournamentOpponent() != '' && _GetTournamentStage() != '' ) : true;
	}

	var _UpdateTournamentButton = function( isHost, isSearching )
	{
		var bIsOfficialCompetitive = m_gameModeSetting === "competitive" && _IsPlayingOnValveOfficial();
		var strTeamName = MyPersonaAPI.GetMyOfficialTeamName();
		var strTournament = MyPersonaAPI.GetMyOfficialTournamentName();
		var isInTournament = isHost && strTeamName != "" && strTournament != "";
		$.GetContextPanel().SetHasClass( "play-menu__tournament", isInTournament );

		var isSearchingForTournament = bIsOfficialCompetitive && isInTournament;

		var elTeamDropdown = $.GetContextPanel().FindChildInLayoutFile( 'TournamentTeamDropdown' );
		var elStageDropdown = $.GetContextPanel().FindChildInLayoutFile( 'TournamentStageDropdown' );
		
		if ( isInTournament )
		{
			function AddDropdownOption( elDropdown, entryID, strText, strData, strSelectedData )
			{
				var newEntry = $.CreatePanel( 'Label', elDropdown, entryID, { data: strData } );
				newEntry.text = strText;
				elDropdown.AddOption( newEntry );

				               
				if ( strSelectedData === strData )
				{
					elDropdown.SetSelected( entryID );
				}
			}

			var strCurrentOpponent = _GetTournamentOpponent();
			var strCurrentStage = _GetTournamentStage();

			                         
			elTeamDropdown.RemoveAllOptions();
			AddDropdownOption( elTeamDropdown, 'PickOpponent', $.Localize( '#SFUI_Tournament_Pick_Opponent' ), '', strCurrentOpponent );
			var teamCount = CompetitiveMatchAPI.GetTournamentTeamCount( strTournament );
			for ( var i = 0; i < teamCount; i++ )
			{
				var strTeam = CompetitiveMatchAPI.GetTournamentTeamNameByIndex( strTournament, i );

				                                  
				if ( strTeamName === strTeam )
					continue;
				
				AddDropdownOption( elTeamDropdown, 'team_' + i, strTeam, strTeam, strCurrentOpponent );
			}
			elTeamDropdown.SetPanelEvent( 'oninputsubmit', _UpdateStartSearchBtn.bind( undefined, isSearchingForTournament ) );

			                          
			elStageDropdown.RemoveAllOptions();
			AddDropdownOption( elStageDropdown, 'PickStage', $.Localize( '#SFUI_Tournament_Stage' ), '', strCurrentStage );
			var stageCount = CompetitiveMatchAPI.GetTournamentStageCount( strTournament );
			for ( var i = 0; i < stageCount; i++ )
			{
				var strStage = CompetitiveMatchAPI.GetTournamentStageNameByIndex( strTournament, i );
				AddDropdownOption( elStageDropdown, 'stage_' + i, strStage, strStage, strCurrentStage );
			}
			elStageDropdown.SetPanelEvent( 'oninputsubmit', _UpdateStartSearchBtn.bind( undefined, isSearchingForTournament ) );
		}
		
		elTeamDropdown.enabled = isSearchingForTournament;
		elStageDropdown.enabled = isSearchingForTournament;

		_UpdateStartSearchBtn( isSearchingForTournament );
		_ShowActiveMapSelectionTab( !isSearchingForTournament );
	}

	var _SyncDialogsFromSessionSettings = function( settings )
	{
		if ( !settings || !settings.game || !settings.system )
		{
			return;
		}

		m_serverSetting = settings.options.server;
		m_permissions = settings.system.access;
		m_gameModeSetting = settings.game.mode;

		                                       
		m_isWorkshop = settings.game.mapgroupname
			&& settings.game.mapgroupname.includes( '@workshop' );

		var isHost = LobbyAPI.BIsHost();
		var isSearching = _IsSearching();
		var isEnabled = !isSearching && isHost ? true : false;

		if ( m_isWorkshop )
		{
			_SwitchToWorkshopTab( isEnabled );
			_SelectMapButtonsFromSettings( settings );
		}
		else if ( m_gameModeSetting )
		{
			                                           
			for ( var i = 0; i < m_arrGameModeRadios.length; ++i )
			{
				var strGameModeForButton = m_arrGameModeRadios[i].id;

				                                               
				if ( strGameModeForButton === m_gameModeSetting )
				{
					m_arrGameModeRadios[i].checked = true;
				}

				                                                                                     
				m_arrGameModeRadios[i].enabled = isEnabled && _IsGameModeAvailable( m_serverSetting, strGameModeForButton );
			}

			                                                                   
			_UpdateMapGroupButtons( isEnabled, isSearching, isHost );

			                                                   
			_CancelRotatingMapGroupSchedule();
			if ( settings.game.mode === "survival" )
			{
				_GetRotatingMapGroupStatus( m_gameModeSetting, settings.game.mapgroupname );
			}

			_SelectMapButtonsFromSettings( settings );
		}
		else
		{
			                                                         
			                                                                     
			                                                                           
			m_arrGameModeRadios[0].checked = true;
		}

		_ShowHideStartSearchBtn( isEnabled );
		_ShowCancelSearchButton( isSearching, isHost );

		                           
		_UpdateTournamentButton( isHost, isSearching );

		                   
		_UpdatePrimeBtn( settings.game.prime === 1 ? true : false );
		_UpdatePermissionBtnText( settings, isEnabled );

		                             
		_UpdateLeaderboardBtn( m_gameModeSetting );

		                                         
		_UpdateSurvivalAutoFillSquadBtn( m_gameModeSetting );

		                                  
		_UpdatePlayDropDown();
		_UpdateBotDifficultyButton();

		$( '#PlayTopNavDropdown' ).enabled = isEnabled;
		_SetClientViewLobbySettingsTitle( isHost );
	};

	var _SetClientViewLobbySettingsTitle = function( isHost )
	{
		var elTitle = $.GetContextPanel().FindChildInLayoutFile( 'LobbyLeaderText' );
		
		if ( isHost )
		{
			elTitle.text = $.Localize( '#SFUI_MainMenu_PlayButton' );
			return;
		}

		var xuid = PartyListAPI.GetPartySystemSetting( "xuidHost" );
		var leaderName = FriendsListAPI.GetFriendName( xuid );
		

		elTitle.SetDialogVariable( 'name', leaderName );
		elTitle.text = $.Localize( '#play_lobbyleader_title', elTitle );
	};

	var _GetAvailableMapGroups = function( gameMode, isPlayingOnValveOfficial )
	{
		                                   
		var gameModeCfg = m_gameModeConfigs[ gameMode ];
		if ( gameModeCfg === undefined )
			return [];

		var mapgroup = isPlayingOnValveOfficial ? gameModeCfg.mapgroupsMP : gameModeCfg.mapgroupsSP;
		if ( mapgroup !== undefined && mapgroup !== null )
		{
			return Object.keys( mapgroup );
		}

		if ( gameMode === "cooperative" && GetMatchmakingQuestId() > 0 )
		{
			return [ LobbyAPI.GetSessionSettings().game.mapgroupname ];
		}

		  
		                                               
		                                
		 
			                         
			                                                           
				                                                                                     
					                                                                                   
				 
			    
			                                 
			 
				                       
			 
		 
		  
		
		return [];
	};

	var _GetMapGroupPanelID = function ( serverType, gameMode )
	{
		var panelID = 'gameModeButtonContainer_' + gameMode + '_' + serverType;
		return panelID;
	}

	var _OnActivateMapOrMapGroupButton = function( mapgroupButton )
	{
		$.DispatchEvent( 'PlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE' );

		if ( _CheckContainerHasAnyChildChecked( _GetMapListForServerTypeAndGameMode( m_activeMapGroupSelectionPanelID )) )
		{ 
			_ApplySessionSettings();
		}
	}
   
	var _ShowActiveMapSelectionTab = function( isEnabled )
	{
		var panelID = m_activeMapGroupSelectionPanelID;

		for ( var key in m_mapSelectionButtonContainers )
		{
			if ( key !== panelID )
			{
				m_mapSelectionButtonContainers[key].AddClass( "hidden" );
			}
			else
			{
				                               
				m_mapSelectionButtonContainers[key].RemoveClass( "hidden" );
				m_mapSelectionButtonContainers[key].visible = true;

				                                         
				m_mapSelectionButtonContainers[key].enabled = isEnabled;
			}
		}

		var isWorkshop = panelID === k_workshopPanelId;
		$( '#WorkshopSearchBar' ).visible = isWorkshop;
		$( '#GameModeSelectionRadios' ).visible = !isWorkshop;

		                                         
		$( '#WorkshopVisitButton' ).visible = isWorkshop && !m_bPerfectWorld;
		$( '#WorkshopVisitButton' ).enabled = SteamOverlayAPI.IsEnabled();
	}

	var _LazyCreateMapListPanel = function( serverType, gameMode )
	{
		                                                                

		var panelID = _GetMapGroupPanelID( serverType, gameMode );
		if ( panelID in m_mapSelectionButtonContainers )
				return panelID;
				
		var container = $.CreatePanel( "Panel", $( '#MapSelectionList' ), panelID, {
			class: 'map-selection-list hidden'
		} );

		m_mapSelectionButtonContainers[ panelID ] = container;

		var isPlayingOnValveOfficial = _IsValveOfficialServer( serverType );
		var arrMapGroups = _GetAvailableMapGroups( gameMode, isPlayingOnValveOfficial );
		
		arrMapGroups.forEach( function( item, index, aMapGroups )
		{
			var elSectionContainer = null;
			if ( gameMode === 'competitive' && _IsValveOfficialServer( m_serverSetting ) )
			{
				container.AddClass( 'map-selection-list--competitive-section-container' );
				container.SetAttributeString( 'hassections', 'true' );
				elSectionContainer = _GetCreateMapListSection( _IsUnranked( aMapGroups[ index ] ) ? 'unranked' : 'ranked', container );
			}
			else
			{
				elSectionContainer = container;
			}
			
			_UpdateOrCreateMapGroupTile( aMapGroups[ index ], elSectionContainer );
		} );

		                                                                          
		container.OnPropertyTransitionEndEvent = function( panelName, propertyName )
		{
			if ( container.id === panelName && propertyName === 'opacity' )
			{
				                                         
				if ( container.visible === true && container.BIsTransparent() )
				{
					container.visible = false;
					return true;
				}
			}
			return false;
		};

		$.RegisterEventHandler( 'PropertyTransitionEnd', container, container.OnPropertyTransitionEndEvent );

		return panelID;
	};

	var _IsUnranked = function( mapName )
	{
		return ( GameTypesAPI.GetMapGroupAttribute( mapName, 'competitivemod' ) === 'unranked' );
	};

	var _GetCreateMapListSection = function( type, container )
	{
		var elSectionContainer = container.FindChildInLayoutFile( m_gameModeSetting + '-maps-section-' + type );

		if ( !elSectionContainer )
		{
			elSectionContainer = $.CreatePanel( 'Panel', container, m_gameModeSetting + '-maps-section-' + type );
			elSectionContainer.SetHasClass( 'map-selection-list-section--single-column', type === 'unranked' );
			elSectionContainer.BLoadLayoutSnippet( "MapListSection" );
			elSectionContainer.FindChildInLayoutFile( 'play-maps-section-header' ).text = $.Localize( '#play_maps_section_' + type );

			elSectionContainer.FindChildInLayoutFile( 'play-maps-section-header-more-info' ).SetPanelEvent( 'onactivate', function()
			{
				UiToolkitAPI.ShowGenericPopup( '#play_maps_section_' + type, '#play_maps_section_tooltip_' + type, '' );
			} );
		}

		return elSectionContainer;
	};

	var _GetPanelTypeForMapGroupTile = function( gameMode )
	{
		var bIsCompetitive = gameMode === 'competitive';
		var bIsSkirmish = gameMode === 'skirmish';
		var bIsWingman = gameMode === 'scrimcomp2v2';

		return ( ( ( bIsCompetitive || bIsSkirmish || bIsWingman ) && _IsValveOfficialServer( m_serverSetting ) ) ? "ToggleButton" : "RadioButton" );
	};

	var _UpdateOrCreateMapGroupTile = function( mapGroupName, container, elTilePanel )
	{
		var mg = GetMGDetails( mapGroupName );
		if ( !mg ) 
			return;

		var p = elTilePanel;                                                            

		if ( !p )
		{
			var panelType = _GetPanelTypeForMapGroupTile( m_gameModeSetting );
			var panelID = container.id;
			p = $.CreatePanel( panelType, container, panelID + mapGroupName );
			p.BLoadLayoutSnippet( "MapGroupSelection" );
			if ( panelType === "RadioButton" )
			{
				p.group = "radiogroup_" + panelID;
			}
		}

		p.SetAttributeString( "mapname", mapGroupName );
		p.SetPanelEvent( 'onactivate', _OnActivateMapOrMapGroupButton.bind( this, p ) );

		p.FindChildInLayoutFile( 'ActiveGroupIcon' ).visible = mg.grouptype === 'active';
		p.FindChildInLayoutFile( 'MapGroupName' ).text = $.Localize( mg.nameID );

		var keysList = Object.keys( mg.maps );
		var mapIcon = null;
		var mapImage = null;

		                                           
		if ( keysList.length > 1 )
		{
			p.AddClass( 'map-selection-btn--large' );
			p.FindChildInLayoutFile( 'MapSelectionButton' ).AddClass( 'map-selection-btn-container--large' );
			p.FindChildInLayoutFile( 'MapGroupName' ).AddClass( 'fontSize-m' );
		}
		else
		{
			if ( m_gameModeSetting === 'survival' && _IsValveOfficialServer( m_serverSetting ) )
			{
				container.AddClass( 'flow-down' );
				
				p.AddClass( 'map-selection-btn--full' );

				if ( MyPersonaAPI.GetLauncherType() === "perfectworld" )
				{
					p.FindChildInLayoutFile( 'MapGroupBetaTag' ).RemoveClass( 'hidden' );
				}

				var elAutoSquadToggle = container.FindChildInLayoutFile( panelID + mapGroupName + 'autosquad' );
				if ( !elAutoSquadToggle )
				{
					var elAutoSquadToggle = $.CreatePanel( 'Panel', container, panelID + mapGroupName + 'autosquad' );
					elAutoSquadToggle.BLoadLayoutSnippet( "SurvivalAutoSquad" );	
				}
			}
			
			var iconPath = mapGroupName === 'random' ? 'file://{images}/icons/ui/random.svg' : 'file://{images}/' + mg.icon_image_path + '.svg';
			var iconSize = m_gameModeSetting === 'survival' ? '256' : '116';
			var mapGroupIcon = p.FindChildInLayoutFile( 'MapSelectionButton' ).FindChildInLayoutFile( 'MapGroupCollectionIcon' );

			if ( mapGroupIcon )
			{
				mapGroupIcon.DeleteAsync(0);
			}
			mapGroupIcon = $.CreatePanel( 'Image', p.FindChildInLayoutFile( 'MapSelectionButton' ), 'MapGroupCollectionIcon', {
				defaultsrc: 'file://{images}/map_icons/map_icon_NONE.png',
				texturewidth: iconSize,
				textureheight: iconSize,
				src: iconPath,
				class: 'map-selection-btn__map-icon'
			} );

			p.FindChildInLayoutFile( 'MapSelectionButton' ).MoveChildBefore( mapGroupIcon, p.FindChildInLayoutFile( 'MapGroupCollectionMultiIcons' ) );
			
		}

		if ( mapGroupName === 'random' )
		{
			mapImage = p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ).FindChildInLayoutFile( 'MapSelectionScreenshot' );

			if ( !mapImage )
			{
				mapImage = $.CreatePanel( 'Panel', p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ), 'MapSelectionScreenshot' );
				mapImage.AddClass( 'map-selection-btn__screenshot' );
			}

			mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/random.png")';
			mapImage.style.backgroundPosition = '50% 0%';
			mapImage.style.backgroundSize = 'auto 100%';
		}
		
		_SetMapGroupModifierLabelElements( mapGroupName, p );

		                              
		for ( var i = 0; i < keysList.length; i++ )
		{
			mapImage = p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ).FindChildInLayoutFile( 'MapSelectionScreenshot' + i );
			if ( !mapImage )
			{
				mapImage = $.CreatePanel( 'Panel', p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ), 'MapSelectionScreenshot' + i );
				mapImage.AddClass( 'map-selection-btn__screenshot' );
			}
			
			if ( m_gameModeSetting === 'survival' )
			{
				mapImage.style.backgroundImage = 'url("file://{resources}/videos/' + keysList[ i ] + '_preview.webm")';
			}
			else
			{
				mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + keysList[ i ] + '.png")';
			}
			mapImage.style.backgroundPosition = '50% 0%';
			mapImage.style.backgroundSize = 'auto 100%';

			                               
			if ( keysList.length > 1 )
			{
				                                   

				mapIcon = p.FindChildInLayoutFile( 'MapGroupCollectionMultiIcons' ).FindChildInLayoutFile( 'MapIcon' + i );
				if ( !mapIcon )
				{
					mapIcon = $.CreatePanel( 'Image', p.FindChildInLayoutFile( 'MapGroupCollectionMultiIcons' ), 'MapIcon' + i, {
						defaultsrc: 'file://{images}/map_icons/map_icon_NONE.png',
						texturewidth: '72',
						textureheight: '72',
						src: 'file://{images}/map_icons/map_icon_' + keysList[ i ] + '.svg'
					} );
						
				}

				mapIcon.AddClass( 'map-selection-btn__map-icon' );
				mapIcon.AddClass( 'map-selection-btn__map-icon-small' );

				IconUtil.SetupFallbackMapIcon( mapIcon, 'file://{images}/map_icons/map_icon_' + keysList[ i ] );
			}
		}

		          
		if ( mg.tooltipID )
		{
			p.SetPanelEvent( 'onmouseover', OnMouseOverMapTile.bind( undefined, p.id, mg.tooltipID, keysList ) );
			p.SetPanelEvent( 'onmouseout', OnMouseOutMapTile );
		}

		return p;
	};

	var OnMouseOverMapTile = function( id, tooltipText, mapsList )
	{
		tooltipText = $.Localize( tooltipText );

		var mapNamesList = [];

		if ( mapsList.length > 1 )
		{
			mapsList.forEach( function( element )
			{
				mapNamesList.push( $.Localize( 'SFUI_Map_' + element ) );
			} );

			var mapGroupsText = mapNamesList.join( ', ' );
			tooltipText = tooltipText + '<br><br>' + mapGroupsText;
		}

		UiToolkitAPI.ShowTextTooltip( id, tooltipText );
	};

	var OnMouseOutMapTile = function()
	{
		UiToolkitAPI.HideTextTooltip();
	};

	var m_timerMapGroupHandler = null;

	var _GetRotatingMapGroupStatus = function( gameMode, mapgroupname )
	{
		m_timerMapGroupHandler = null;
		var strSchedule = CompetitiveMatchAPI.GetRotatingOfficialMapGroupCurrentState( gameMode, mapgroupname );
		var elTimer = m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ].FindChildInLayoutFile( 'PlayMenuMapRotationTimer' );

		if ( elTimer )
		{
			if ( strSchedule )
			{
				var strCurrentMapGroup = strSchedule.split( "+" )[ 0 ];
				var numSecondsRemaining = strSchedule.split( "+" )[ 1 ].split( "=" )[ 0 ];
				var strNextMapGroup = strSchedule.split( "=" )[ 1 ];
				var numWait = FormatText.SecondsToDDHHMMSSWithSymbolSeperator( numSecondsRemaining );

				if ( !numWait )
				{
					elTimer.SetHasClass( 'hidden' );
					return;
				}

				elTimer.RemoveClass( 'hidden' );
				elTimer.SetDialogVariable( 'map-rotate-timer', numWait );

				var mg = GetMGDetails( strNextMapGroup );
				elTimer.SetDialogVariable( 'next-mapname', $.Localize( mg.nameID ) );	

				                               
				                                                                                                 
				var mapGroupPanelID = _GetMapGroupPanelID( m_serverSetting, gameMode );
				var mapGroupContainer = m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ];

				var mapGroupPanel = mapGroupContainer.FindChildInLayoutFile( mapGroupPanelID + strCurrentMapGroup );
				if ( !mapGroupPanel )
				{
					mapGroupContainer.RemoveAndDeleteChildren();
					var btnMapGroup = _UpdateOrCreateMapGroupTile( strCurrentMapGroup, mapGroupContainer );
					
					                                                                            
					btnMapGroup.checked = true;
					_UpdateSurvivalAutoFillSquadBtn( m_gameModeSetting );
				}

				m_timerMapGroupHandler = $.Schedule( 1, _GetRotatingMapGroupStatus.bind( undefined, gameMode, mapgroupname ) );
				
				                                                                                                                                                                                                     
			}
			else
			{
				elTimer.SetHasClass( 'hidden' );
			}
		}
	};

	var _StartRotatingMapGroupTimer = function()
	{
		_CancelRotatingMapGroupSchedule();
		
		if ( m_gameModeSetting && m_gameModeSetting === "survival"
			&& m_mapSelectionButtonContainers && m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ]
			&& m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ].Children() )
		{
			var btnSelectedMapGroup = m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ].Children().filter( entry => entry.GetAttributeString( 'mapname', '' ) !== '' );

			if ( btnSelectedMapGroup[ 0 ] )
			{ 
				var mapSelectedGroupName = btnSelectedMapGroup[ 0 ].GetAttributeString( 'mapname', '' );
				if ( mapSelectedGroupName )
				{
					_GetRotatingMapGroupStatus( m_gameModeSetting, mapSelectedGroupName );
				}
			}
		}
	};

	var _CancelRotatingMapGroupSchedule = function()
	{
		if ( m_timerMapGroupHandler )
		{
			$.CancelScheduled( m_timerMapGroupHandler );
			                                                                        
			m_timerMapGroupHandler = null;
		}
	};

	var _SetMapGroupModifierLabelElements = function( mapName, elMapPanel )
	{
		var isUnrankedCompetitive = false;                                                                                                                                                                             
		var isNew = !isUnrankedCompetitive  && ( GameTypesAPI.GetMapGroupAttribute( mapName, 'showtagui' ) === 'new' );

		elMapPanel.FindChildInLayoutFile( 'MapGroupNewTag' ).SetHasClass( 'hidden', !isNew );
		elMapPanel.FindChildInLayoutFile( 'MapGroupUnrankedTag' ).SetHasClass( 'hidden', !isUnrankedCompetitive );
	};


	var _UpdateMapGroupButtons = function( isEnabled, isSearching, isHost )
	{
		var panelID;
		if ( m_gameModeSetting === "cooperative" )
		{
			var panelID = _GetMapGroupPanelID( m_serverSetting, m_gameModeSetting );
			if ( !(panelID in m_mapSelectionButtonContainers) )
			{
				m_mapSelectionButtonContainers[ panelID ] = $.CreatePanel( "Panel", $( '#MapSelectionList' ), panelID );
				m_mapSelectionButtonContainers[ panelID ].BLoadLayoutSnippet( "CoopMission" );
				var elMapTile = m_mapSelectionButtonContainers[ panelID ].FindChildTraverse( "MapTile" );
				elMapTile.BLoadLayoutSnippet( "MapGroupSelection" );
			}

			_UpdateOrCreateMapGroupTile( LobbyAPI.GetSessionSettings().game.mapgroupname, m_mapSelectionButtonContainers[ panelID ], m_mapSelectionButtonContainers[ panelID ].FindChildTraverse( "MapTile" ) );

			if ( GetMatchmakingQuestId() > 0 )
			{
				var lbName = "official_leaderboard_quest_" + GetMatchmakingQuestId();
				var elFriendLeaderboards = m_mapSelectionButtonContainers[ panelID ].FindChildTraverse( "FriendLeaderboards" );
				if ( elFriendLeaderboards.GetAttributeString( "type", null ) !== lbName  )
				{
					elFriendLeaderboards.SetAttributeString( "type", "official_leaderboard_quest_" + GetMatchmakingQuestId() );
					elFriendLeaderboards.SetAttributeString( "points-title", "#Cstrike_TitlesTXT_WINS" );
					elFriendLeaderboards.BLoadLayout('file://{resources}/layout/popups/popup_leaderboards.xml', true, false);
					elFriendLeaderboards.RemoveClass( 'Hidden' );
					elFriendLeaderboards.AddClass( 'leaderboard_embedded' );
					elFriendLeaderboards.AddClass( 'play_menu_survival' );
				}

				var elDescriptionLabel = m_mapSelectionButtonContainers[ panelID ].FindChildTraverse( "MissionDesc" );
				MissionsAPI.ApplyQuestDialogVarsToPanelJS( GetMatchmakingQuestId(), elDescriptionLabel );
			}
		}
		else 
		{
			panelID = _LazyCreateMapListPanel( m_serverSetting, m_gameModeSetting );
			
			                                    
			if ( ( m_gameModeSetting === 'competitive' || m_gameModeSetting === 'scrimcomp2v2' ) && _IsPlayingOnValveOfficial() )
			{
				_UpdateWaitTime( _GetMapListForServerTypeAndGameMode(  panelID ) );
			}

			_SetEnabledStateForMapBtns( m_mapSelectionButtonContainers[ panelID ], isSearching, isHost );
		}

		                    
		m_activeMapGroupSelectionPanelID = panelID;
		_ShowActiveMapSelectionTab( isEnabled );

	};

	var _SelectMapButtonsFromSettings = function( settings )
	{
		                                                                 
		var mapsGroups = settings.game.mapgroupname.split( ',' );
		var aListMaps = _GetMapListForServerTypeAndGameMode( m_activeMapGroupSelectionPanelID );
		aListMaps.forEach( function( e )
		{
			                                                                      
			var mapName = e.GetAttributeString( "mapname", "invalid" );
			e.checked = mapsGroups.includes( mapName );
		} );
	};

	var _ShowHideStartSearchBtn = function( bShow )
	{
		var btnStartSearch = $.GetContextPanel().FindChildInLayoutFile( 'StartMatchBtn' );

		                                                                    
		                                                                                        
		                                                 
		if ( bShow )
		{
			if ( btnStartSearch.BHasClass( 'pressed' ) )
			{
				btnStartSearch.RemoveClass( 'pressed' );
			}

			btnStartSearch.RemoveClass( 'hidden' );
		}
		                                                                                                     
		                                            
		else if ( !btnStartSearch.BHasClass( 'pressed' ) )
		{
			btnStartSearch.AddClass( 'hidden' );
		}
	};

	var _ShowCancelSearchButton = function( isSearching, isHost )
	{
		var btnCancel= $.GetContextPanel().FindChildInLayoutFile( 'PartyCancelBtn' );
		                                                                 
		btnCancel.enabled = ( isSearching && isHost );
	};

	var _UpdatePrimeBtn = function( isPrime )
	{
		var elPrimeStatusButton = $( '#PrimeStatusButton' );

		                                                                                  
		if ( !_IsPlayingOnValveOfficial() || !MyPersonaAPI.IsInventoryValid() )
		{
			elPrimeStatusButton.visible = false;
			return;
		}

		elPrimeStatusButton.visible = true;
		elPrimeStatusButton.checked = false;
		elPrimeStatusButton.RemoveClass( 'active' );
		var btnText = '';
		var tooltipText = '';

		                                                
		                                                                               
		if ( SessionUtil.AreLobbyPlayersPrime() )
		{
			tooltipText = isPrime ? '#tooltip_prime_only' : '#tooltip_prime_priority';
			btnText = "#SFUI_Elevated_Status_enabled";
			elPrimeStatusButton.checked = true;
			elPrimeStatusButton.AddClass( 'active' );
		}
		else if (!PartyListAPI.GetFriendPrimeEligible( MyPersonaAPI.GetXuid() ) )
		{
			               
			var bPrimeUpgradeAvailable = MyPersonaAPI.HasPrestige() || FriendsListAPI.GetFriendLevel( MyPersonaAPI.GetXuid() ) > 20;
			if ( bPrimeUpgradeAvailable )
			{
				tooltipText = "#tooltip_prime_upgrade_available";
			}
			else
			{
				var isPerfectWorld = MyPersonaAPI.GetLauncherType() == "perfectworld" ? true : false;
				tooltipText = isPerfectWorld ? '#tooltip_prime_not_enrolled_pw_1' : '#tooltip_prime_not_enrolled_1';
			}

			btnText = "#SFUI_Elevated_Status_upgrade_status";
		}
		else
		{
			                                         
			tooltipText = '#tooltip_prime-lobby_has_nonprime_player';
			btnText = "#SFUI_Elevated_Status_disabled";
		}

		elPrimeStatusButton.FindChild( 'PrimeStatusButtonLabel' ).text = $.Localize( btnText );

		elPrimeStatusButton.SetPanelEvent( 'onmouseover', function() { UiToolkitAPI.ShowTextTooltip( elPrimeStatusButton.id, tooltipText ); } );
		elPrimeStatusButton.SetPanelEvent( 'onmouseout', function() { UiToolkitAPI.HideTextTooltip(); } );
		elPrimeStatusButton.SetPanelEvent( 'onactivate', function()
		{
			UiToolkitAPI.HideTextTooltip();
			UiToolkitAPI.ShowCustomLayoutPopup( 'prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml' );
		} );
	};

	var _UpdatePermissionBtnText = function( settings, isEnabled )
	{
		var elBtn = $( '#PermissionsSettings' );
		var displayText = '';

		var elLockImg = $.GetContextPanel().FindChildInLayoutFile( 'PermissionsSettingsImg' );
		if ( settings.system.access === 'public' )
		{
			displayText = '#permissions_' + settings.system.access;
			elLockImg.SetImage( "file://{images}/icons/ui/unlockedwide.svg" );
		}
		else
		{
			displayText = '#permissions_' + settings.system.access;
			elLockImg.SetImage( "file://{images}/icons/ui/locked.svg" );
		}

		elBtn.FindChild( 'PermissionsSettingsLabel' ).text = $.Localize( displayText ).toUpperCase();

		                                           
		elBtn.enabled = isEnabled;
	};

	function GetMatchmakingQuestId()
	{
		return parseInt( LobbyAPI.GetSessionSettings().game.questid ) || 0;
	}

	var _UpdateLeaderboardBtn = function( gameMode, isOfficalMatchmaking )
	{
		var elLeaderboardButton = $( '#PlayMenulLeaderboards' );
		
		if ( gameMode === 'survival' && _IsPlayingOnValveOfficial() )
		{
			elLeaderboardButton.visible = true;
			
			var _OnActivate = function ()
			{
				UiToolkitAPI.ShowCustomLayoutPopupParameters(
					'',
					'file://{resources}/layout/popups/popup_leaderboards.xml',
					'type=official_leaderboard_survival_squads,official_leaderboard_survival_solo' +
					'&' + 'titleoverride=#CSGO_official_leaderboard_survival_title' +
					'&' + 'showglobaloverride=false' +
					'&' + 'points-title=#Cstrike_TitlesTXT_WINS',
					'none'
				);
			};

			elLeaderboardButton.SetPanelEvent( 'onactivate', _OnActivate );
		}
		else if ( gameMode == 'cooperative' && GetMatchmakingQuestId() > 0 )
		{
			elLeaderboardButton.visible = true;
			elLeaderboardButton.SetPanelEvent( 'onactivate', function()
			{
				UiToolkitAPI.ShowCustomLayoutPopupParameters(
					'',
					'file://{resources}/layout/popups/popup_leaderboards.xml',
					'type=official_leaderboard_quest_' + GetMatchmakingQuestId(),
					'&' + 'titleoverride=#CSGO_Operation_Leaderboard_TitleActive' +
					'&' + 'showglobaloverride=false' +
					'&' + 'points-title=#Cstrike_TitlesTXT_WINS',
					'none'
				);
			} );
		}
		else
		{ 
			elLeaderboardButton.visible = false;
		}
	};

	var _UpdateSurvivalAutoFillSquadBtn = function( gameMode )
	{
		var elBtn = $( '#SurvivalAutoSquadToggle' );

		if ( !elBtn )
		{
			return;
		}

		if ( gameMode === 'survival' && _IsPlayingOnValveOfficial() && ( PartyListAPI.GetCount() <= 1 ) )
		{
			elBtn.visible = true;
			var bAutoFill = !( GameInterfaceAPI.GetSettingString( 'ui_playsettings_survival_solo' ) === '1' );
			elBtn.checked = bAutoFill;
			elBtn.enabled = !_IsSearching();

			var _OnActivate = function()
			{
				var bAutoFill = !( GameInterfaceAPI.GetSettingString( 'ui_playsettings_survival_solo' ) === '1' );
				GameInterfaceAPI.SetSettingString( 'ui_playsettings_survival_solo', bAutoFill ? '1' : '0' );
				_UpdateSurvivalAutoFillSquadBtn( 'survival' );
			};

			elBtn.SetPanelEvent( 'onactivate', _OnActivate );
		}
		else
		{
			elBtn.visible = false;
		}
	};

	var _SetEnabledStateForMapBtns = function( elMapList, isSearching, isHost )
	{
		elMapList.SetHasClass( 'is-client', ( isSearching || !isHost ) );

		var childrenList = _GetMapListForServerTypeAndGameMode();

		childrenList.forEach(element => {
			if ( element.id !== "SurvivalLeaderboardsContainer" )
			element.enabled = !isSearching && isHost; 
		});
	};

	var _UpdateWaitTime = function( elMapList )
	{
		var childrenList = elMapList;

		for ( var i = 0; i < childrenList.length; i++ )
		{
			var elWaitTime = childrenList[ i ].FindChildTraverse( 'MapGroupWaitTime' );
			var mapName = childrenList[ i ].GetAttributeString( "mapname", "invalid" );

			if ( mapName === 'invalid' )
			{
				continue;
			}

			var seconds = LobbyAPI.GetMapWaitTimeInSeconds( m_gameModeSetting, mapName );
			var numWait = FormatText.SecondsToDDHHMMSSWithSymbolSeperator( seconds );

			if ( numWait )
			{
				elWaitTime.SetDialogVariable( "time", numWait );
				elWaitTime.FindChild( 'MapGroupWaitTimeLabel' ).text = $.Localize( '#matchmaking_expected_wait_time', elWaitTime );
				elWaitTime.RemoveClass( 'hidden' );
			}
			else
			{
				elWaitTime.AddClass( 'hidden' );
			}
		}
	};

	var _UpdatePlayDropDown = function()
	{
		if ( m_activeMapGroupSelectionPanelID === k_workshopPanelId )
		{
			$( '#PlayTopNavDropdown' ).SetSelected( 'PlayWorkshop' );
		}
		else
		{
			$( '#PlayTopNavDropdown' ).SetSelected( 'Play-' + m_serverSetting );
		}
	};

	var _IsValveOfficialServer = function( serverType )
	{
		return serverType === "official" ? true : false
	}

	var _IsPlayingOnValveOfficial = function()
	{
		return _IsValveOfficialServer( m_serverSetting );
	};

	var _IsSearching = function()
	{
		var searchingStatus = LobbyAPI.GetMatchmakingStatusString();
		return searchingStatus !== '' && searchingStatus !== undefined ? true : false;
	};

	                                                         
	var _GetSelectedMapsForServerTypeAndGameMode = function( serverType, gameMode )
	{
		var isPlayingOnValveOfficial = _IsValveOfficialServer( serverType );
		                                                                         
		                                                                        
		var aListMapPanels = _GetMapListForServerTypeAndGameMode();

		                                                                                                             
		if ( !_CheckContainerHasAnyChildChecked( aListMapPanels ) )
		{
			                                                                      
			var preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString( 'ui_playsettings_maps_' + serverType + '_' + gameMode );

			                                          
			if ( !preferencesMapsForThisMode )
				preferencesMapsForThisMode = '';

			var savedMapIds = preferencesMapsForThisMode.split( ',' );
			savedMapIds.forEach( function( strMapNameIndividual )
			{
				var mapsWithThisName = aListMapPanels.filter( function( map )
				{
					var mapName = map.GetAttributeString( "mapname", "invalid" );
					return mapName === strMapNameIndividual;
				} );
				if ( mapsWithThisName.length > 0 )
				{
					mapsWithThisName[ 0 ].checked = true;
				}
			} );

			if ( aListMapPanels.length > 0 && !_CheckContainerHasAnyChildChecked( aListMapPanels ) )
			{
				aListMapPanels[ 0 ].checked = true;
			}
		}

		                                                                   
		if ( serverType === 'official' && gameMode === 'survival' )
		{	                                                    
			return GameInterfaceAPI.GetSettingString( 'ui_playsettings_maps_' + serverType + '_' + gameMode );
		}

		var selectedMaps = aListMapPanels.filter( function( e )
		{
			                                                         
			return e.checked;
		} ).reduce( function( accumulator, e )
		{
			                                              
			var mapName = e.GetAttributeString( "mapname", "invalid" );
			return ( accumulator ) ? ( accumulator + "," + mapName ) : mapName;
		}, '' );

		return selectedMaps;
	};

	var _GetMapListForServerTypeAndGameMode = function( mapGroupOverride )
	{
		var mapGroupPanelID = !mapGroupOverride ? _LazyCreateMapListPanel( m_serverSetting, m_gameModeSetting ) : mapGroupOverride;
		var elParent = m_mapSelectionButtonContainers[ mapGroupPanelID ];

		if ( m_gameModeSetting === 'competitive' && elParent.GetAttributeString( 'hassections', '') )
		{
			var aListMapPanels = [];
			elParent.Children().forEach( function( section )
			{
				section.Children().forEach( function( tile )
				{
					if ( tile.id != 'play-maps-section-header-container' )
					{
						aListMapPanels.push( tile );
					}
				} );
			} );

			return aListMapPanels;
		}
		else
		{
			return elParent.Children();
		}
	};

	var _GetSelectedWorkshopMapButtons = function()
	{
		var mapGroupPanelID = _LazyCreateWorkshopTab();
		var mapContainer = m_mapSelectionButtonContainers[mapGroupPanelID];
		var children = mapContainer.Children();

		if ( children.length == 0 || !children[0].group )
		{
			                   
			return [];
		}

		                                                                                                             
		if ( !_CheckContainerHasAnyChildChecked( children ) )
		{
			var preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString( 'ui_playsettings_maps_workshop' );

			                                          
			if ( !preferencesMapsForThisMode )
				preferencesMapsForThisMode = '';

			var savedMapIds = preferencesMapsForThisMode.split( ',' );
			savedMapIds.forEach( function ( strMapNameIndividual ) {
				var mapsWithThisName = children.filter( function ( map ) {
					var mapName = map.GetAttributeString( "mapname", "invalid" );
					return mapName === strMapNameIndividual;
				} );
				if ( mapsWithThisName.length > 0 )
				{
					mapsWithThisName[0].checked = true;
				}
			} );

			if ( !_CheckContainerHasAnyChildChecked( children ) && children.length > 0 )
			{
				children[0].checked = true;
			}
		}

		var selectedMaps = children.filter( function ( e ) {
			                                                         
			return e.checked;
		} );

		return Array.from(selectedMaps);
	};

	var _GetSelectedWorkshopMap = function()
	{
		var mapButtons = _GetSelectedWorkshopMapButtons();

		var selectedMaps = mapButtons.reduce( function ( accumulator, e ) {
			                                              
			var mapName = e.GetAttributeString( "mapname", "invalid" );
			return ( accumulator ) ? ( accumulator + "," + mapName ) : mapName;
		}, '' );

		return selectedMaps;
	};

	                                                                                                    
	                                                    
	                                                                                                    
	var _CheckContainerHasAnyChildChecked = function( aMapList )
	{
		if ( aMapList.length < 1 )
			return false;

		return aMapList.filter( function( map )
		{
			return map.checked;
		} ).length > 0;
	};

	                                                                                                    
	                                                    
	                                                                                                    
	var _ValidateSessionSettings = function()
	{
		if ( m_isWorkshop )
		{
			                                     
			m_serverSetting = "listen";
		}

		if ( !_IsGameModeAvailable( m_serverSetting, m_gameModeSetting ) )
		{
			                                   
			  
			                                                   
			m_gameModeSetting = "casual";
		}
	};

	                                                                                                    
	                                   
	                                                                                                    
	var _ApplySessionSettings = function()
	{
		if ( m_gameModeSetting === 'scrimcomp2v2' )
		{	                                                                                     
			MyPersonaAPI.HintLoadPipRanks( 'wingman' );
		}
		else if ( m_gameModeSetting === 'survival' )
		{	                                                                                     
			MyPersonaAPI.HintLoadPipRanks( 'dangerzone' );
		}

		if ( !LobbyAPI.BIsHost() )
		{
			return;
		}

		                                                     
		_ValidateSessionSettings();

		                                                                                 
		var serverType = m_serverSetting;
		var gameMode = m_gameModeSetting;
		var selectedMaps;

		if ( m_isWorkshop )
			selectedMaps = _GetSelectedWorkshopMap();
		else
			selectedMaps = _GetSelectedMapsForServerTypeAndGameMode( serverType, gameMode );

		var settings = {
			update: {
				Options: {
					action: "custommatch",
					server: serverType
				},
				Game: {
					                            
					mode: gameMode,
					type: GetGameType( gameMode ),
					mapgroupname: selectedMaps
				},
			}
		};

		                                                                                                                                      
		                                                                                                                                      
		                                                                                                                                
		                                                                                                                                      
		                                                                                       
		if ( selectedMaps.startsWith( "random_" ) )
		{
			var arrMapGroups = _GetAvailableMapGroups( gameMode, false );
			var idx = 1 + Math.floor( ( Math.random() * ( arrMapGroups.length - 1 ) ) );
			settings.update.Game.map = arrMapGroups[ idx ].substring( 3 );
		}

		                       
		                                                  
		if ( m_isWorkshop )
		{
			GameInterfaceAPI.SetSettingString( 'ui_playsettings_maps_workshop', selectedMaps );
		}
		else
		{
			GameInterfaceAPI.SetSettingString( 'ui_playsettings_mode_' + serverType, m_gameModeSetting );
			GameInterfaceAPI.SetSettingString( 'ui_playsettings_maps_' + serverType + '_' + m_gameModeSetting, selectedMaps );
		}

		                                                                  
		                                                                                          
		LobbyAPI.UpdateSessionSettings( settings );
	};

	                                                                                                    
	                                
	                                                                                                    
	var _SessionSettingsUpdate = function( sessionState ) 
	{
		                                                                
		if ( sessionState === "ready" )
		{
			_Init();                                                                  
		}
		                                                      
		else if ( sessionState === "updated" )
		{
			var settings = LobbyAPI.GetSessionSettings();

			_SyncDialogsFromSessionSettings( settings );
		}
		else if ( sessionState === "closed" )
		{
			                                         
			          
			$.DispatchEvent( 'HideContentPanel' );
		}
	};

	var _ReadyForDisplay = function()
	{
		_StartRotatingMapGroupTimer();
	};

	var _UnreadyForDisplay = function()
	{
		_CancelRotatingMapGroupSchedule();
	};

	var _OnHideMainMenu = function()
	{
		$( '#MapSelectionList' ).FindChildrenWithClassTraverse( "map-selection-btn__carousel" ).forEach( function( entry )
		{
			entry.SetAutoScrollEnabled( false );
		} );
	};

	var _OnShowMainMenu = function()
	{	
		$( '#MapSelectionList' ).FindChildrenWithClassTraverse( "map-selection-btn__carousel" ).forEach( function( entry )
		{
			entry.SetAutoScrollEnabled( true );
		} );
	};

	var _GetPlayType = function()
	{
		var elDropDownEntry = $( '#PlayTopNavDropdown' ).GetSelected();
		var playType = elDropDownEntry.GetAttributeString( 'data-type', '(not_found)' );
		return playType;
	};

	var _InitializeWorkshopTags = function ( panel, mapInfo )
	{
		var mapTags = mapInfo.tags ? mapInfo.tags.split( "," ) : [];

		                          
		var rawModes = [];
		var modes = [];
		var tags = [];

		for ( var i = 0; i < mapTags.length; ++i )
		{
			                               
			                                                  
			var modeTag = mapTags[i].toLowerCase().split( ' ' ).join( '' ).split( '-' ).join( '' );
			if ( modeTag in k_workshopModes )
			{
				var gameTypes = k_workshopModes[modeTag].split(',');
				for( var iType = 0; iType < gameTypes.length; ++iType )
				{
					if( !rawModes.includes( gameTypes[iType] ) )
						rawModes.push( gameTypes[iType] );
				}

				modes.push( $.Localize( '#CSGO_Workshop_Mode_' + modeTag ) );
			}
			else
			{
				tags.push( $.HTMLEscape( mapTags[i] ) );
			}
		}

		                   
		var tooltip = mapInfo.desc ? $.HTMLEscape( mapInfo.desc, true ) : '';

		if ( modes.length > 0 )
		{
			if ( tooltip )
				tooltip += '<br><br>';

			tooltip += $.Localize( "#CSGO_Workshop_Modes" );
			tooltip += ' ';
			tooltip += modes.join(', ');
		}

		if ( tags.length > 0 )
		{
			if ( tooltip )
				tooltip += '<br><br>';

			tooltip += $.Localize( "#CSGO_Workshop_Tags" );
			tooltip += ' ';
			tooltip += tags.join( ', ' );
		}

		panel.SetAttributeString( 'data-tooltip', tooltip );                               
		panel.SetAttributeString( 'data-workshop-modes', rawModes.join( ',' ) );
	}

	var _ShowWorkshopMapInfoTooltip = function ( panel )
	{
		var text = panel.GetAttributeString( 'data-tooltip', '' );

		if ( text )
			UiToolkitAPI.ShowTextTooltip( panel.id, text );
	};

	var _HideWorkshopMapInfoTooltip = function ()
	{
		UiToolkitAPI.HideTextTooltip();
	};


	var _LazyCreateWorkshopTab = function()
	{
		var panelId = k_workshopPanelId;

		if ( panelId in m_mapSelectionButtonContainers )
			return panelId;

		                      
		var container = $.CreatePanel( "Panel", $( '#MapSelectionList' ), panelId, {
			class: 'map-selection-list hidden'
		} );

		m_mapSelectionButtonContainers[ panelId ] = container;

		var numMaps = WorkshopAPI.GetNumSubscribedMaps();
		for ( var idxMap = 0; idxMap < numMaps; ++idxMap )
		{
			var strMapId = WorkshopAPI.GetSubscribedMapID( idxMap );
			var mapInfo = WorkshopAPI.GetWorkshopMapInfo( strMapId );
			if ( !mapInfo || !mapInfo.mapgroup )
				continue;

			var p = $.CreatePanel( 'RadioButton', container, panelId + '_' + idxMap );
			p.BLoadLayoutSnippet( 'MapGroupSelection' );
			p.group = 'radiogroup_' + panelId;

			if ( !( mapInfo.imageUrl ) )
				mapInfo.imageUrl = 'file://{images}/map_icons/screenshots/360p/random.png';

			p.SetAttributeString( 'mapname', mapInfo.mapgroup );
			p.SetPanelEvent( 'onactivate', _OnActivateMapOrMapGroupButton.bind( this, p ) );
			p.FindChildInLayoutFile( 'ActiveGroupIcon' ).visible = false;
			p.FindChildInLayoutFile( 'MapGroupName' ).text = mapInfo.name;

			var mapImage = $.CreatePanel( 'Panel', p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ), 'MapSelectionScreenshot0' );
			mapImage.AddClass( 'map-selection-btn__screenshot' );
			mapImage.style.backgroundImage = 'url("' + mapInfo.imageUrl + '")';
			mapImage.style.backgroundPosition = '50% 0%';
			mapImage.style.backgroundSize = 'auto 100%';

			_InitializeWorkshopTags( p, mapInfo );

			p.SetPanelEvent( 'onmouseover', _ShowWorkshopMapInfoTooltip.bind( null, p ) );
			p.SetPanelEvent( 'onmouseout', _HideWorkshopMapInfoTooltip.bind( null ) );
		}

		if ( numMaps == 0 )
		{
			var p = $.CreatePanel( 'Panel', container, undefined );
			p.BLoadLayoutSnippet( 'NoWorkshopMaps' );
		}

		                                        
		_UpdateWorkshopMapFilter();

		return panelId;
	};

	var _SwitchToWorkshopTab = function( isEnabled )
	{
		var panelId = _LazyCreateWorkshopTab();
		m_activeMapGroupSelectionPanelID = panelId;
		_ShowActiveMapSelectionTab( isEnabled );
	};

	var _PlayTopNavDropdownChanged = function()
	{
		var playType = _GetPlayType();

		if ( playType === 'listen' || playType === 'training' || playType === 'workshop' )
		{
			                                       
		}
		else
		{
			var restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
			if ( restrictions !== false )
			{
				LicenseUtil.ShowLicenseRestrictions( restrictions );
				                                                                       
				_UpdatePlayDropDown();
				return false;
			}
		}

		if ( playType === 'official' || playType === 'listen' )
		{
			m_isWorkshop = false;
			m_serverSetting = playType;
			_ApplySessionSettings();
			return;
		}
		else if ( playType === 'training' )
		{
			UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( 'Training',
				'#play_training_confirm',
				'',
				'#OK',
				function()
				{
					LobbyAPI.LaunchTrainingMap();
				},
				'#Cancel_Button',
				function()
				{
				},
				'dim'
			);
		}
		else if ( playType === 'workshop' )
		{
			_SetPlayDropdownToWorkshop();
			return;
		}
		else if ( playType === 'community' )
		{
			if ( '0' === GameInterfaceAPI.GetSettingString( 'player_nevershow_communityservermessage' ) )
			{
				UiToolkitAPI.ShowCustomLayoutPopup( 'server_browser_popup', 'file://{resources}/layout/popups/popup_serverbrowser.xml' );
			}
			else
			{
				if ( m_bPerfectWorld )
				{
					SteamOverlayAPI.OpenURL( 'https://csgo.wanmei.com/communityserver' );
				}
				else
				{
					GameInterfaceAPI.ConsoleCommand( "gamemenucommand openserverbrowser" );
				}
			}
		}

		                                                   
		_UpdatePlayDropDown();
	};

	var _UpdateBotDifficultyButton = function()
	{
		var playType = _GetPlayType();

		var elDropDown = $( '#BotDifficultyDropdown' );

		var bShowBotDifficultyButton = ( playType === 'listen' || playType === 'workshop' );
		elDropDown.SetHasClass( "hidden", !bShowBotDifficultyButton );

		                         
		var botDiff = GameInterfaceAPI.GetSettingString( 'player_botdifflast_s' );
		GameTypesAPI.SetCustomBotDifficulty( botDiff );
		elDropDown.SetSelected( botDiff );
	};

	var _BotDifficultyChanged = function()
	{
		var elDropDownEntry = $( '#BotDifficultyDropdown' ).GetSelected();
		var botDiff = elDropDownEntry.id;

		GameTypesAPI.SetCustomBotDifficulty( botDiff );

		                                  
		GameInterfaceAPI.SetSettingString( 'player_botdifflast_s', botDiff )
	};

	var _DisplayWorkshopModePopup = function()
	{
		                         
		var elSelectedMaps = _GetSelectedWorkshopMapButtons();
		var modes = [];

		for ( var iMap = 0; iMap < elSelectedMaps.length; ++iMap )
		{
			var mapModes = elSelectedMaps[ iMap ].GetAttributeString( 'data-workshop-modes', '' ).split( ',' );

			                                                          
			if ( iMap == 0 )
				modes = mapModes;
			else
				modes = modes.filter( function( mode ) { return mapModes.includes( mode ); } );
		}

		var strModes = modes.join( ',' );
		UiToolkitAPI.ShowCustomLayoutPopupParameters( 'workshop_map_mode', 'file://{resources}/layout/popups/popup_workshop_mode_select.xml', 'workshop-modes=' + $.UrlEncode( strModes ) );
	};

	var _UpdateWorkshopMapFilter = function()
	{
		var filter = $.HTMLEscape( $( '#WorkshopSearchTextEntry' ).text, true ).toLowerCase();
		var container = m_mapSelectionButtonContainers[ k_workshopPanelId ];

		if ( !container )
			return;                       

		var children = container.Children();

		for ( var i = 0; i < children.length; ++i )
		{
			var panel = children[ i ];

			                                                                        
			var mapname = panel.GetAttributeString( 'mapname', '' );
			if ( mapname === '' )
				continue;

			                               
			if ( filter === '' ) 
			{
				panel.visible = true;
				continue;
			}

			                                                                         
			if ( mapname.toLowerCase().includes( filter ) )
			{
				panel.visible = true;
				continue;
			}

			                                                                
			var modes = panel.GetAttributeString( 'data-workshop-modes', '' );
			if ( modes.toLowerCase().includes( filter ) )
			{
				panel.visible = true;
				continue;
			}

			                                                                                           
			                                             
			var tooltip = panel.GetAttributeString( 'data-tooltip', '' );
			if ( tooltip.toLowerCase().includes( filter ) )
			{
				panel.visible = true;
				continue;
			}

			                                                                                  
			                                                             
			var mapname = panel.FindChildTraverse( 'MapGroupName' );
			if ( mapname && mapname.text && mapname.text.toLowerCase().includes( filter ) )
			{
				panel.visible = true;
				continue;
			}

			panel.visible = false;
		}
	};

	var _SetPlayDropdownToWorkshop = function()
	{
		                                           
		m_serverSetting = 'listen';
		m_isWorkshop = true;
		if ( _GetSelectedWorkshopMap() )
		{
			_ApplySessionSettings();
		}
		else
		{
			                                                                                             
			_SwitchToWorkshopTab( true );
		}
	};

	var _WorkshopSubscriptionsChanged = function()
	{
		var currentMap = '';
		var panel = m_mapSelectionButtonContainers[k_workshopPanelId];
		if ( panel )
		{
			currentMap = _GetSelectedWorkshopMap();
			panel.DeleteAsync( 0.0 );

			                  
			delete m_mapSelectionButtonContainers[k_workshopPanelId];
		}

		if ( m_activeMapGroupSelectionPanelID != k_workshopPanelId )
		{
			                                                                       
			return;
		}

		if ( !LobbyAPI.IsSessionActive() )
		{
			                                                                                                                    
			                                           

			                                                                                                            
			                                                              
			m_activeMapGroupSelectionPanelID = null;
			return;
		}

		                                                
		_SyncDialogsFromSessionSettings( LobbyAPI.GetSessionSettings() );

		                                                                                                                                      
		if ( LobbyAPI.BIsHost() )
		{
			_ApplySessionSettings();

			                                                                                                                          
			_SetPlayDropdownToWorkshop();
		}
	}

	return {
		Init: _Init,
		SessionSettingsUpdate		: _SessionSettingsUpdate,
		ReadyForDisplay				: _ReadyForDisplay,
		UnreadyForDisplay 			: _UnreadyForDisplay,
		OnHideMainMenu				: _OnHideMainMenu,
		OnShowMainMenu				: _OnShowMainMenu,
		PlayTopNavDropdownChanged	: _PlayTopNavDropdownChanged,
		BotDifficultyChanged		: _BotDifficultyChanged,
		WorkshopSubscriptionsChanged: _WorkshopSubscriptionsChanged,
		UpdatePrimeBtn				: _UpdatePrimeBtn
	};

} )();

                                                                                                    
                                           
                                                                                                    
( function()
{
	PlayMenu.Init();
	$.RegisterEventHandler( "ReadyForDisplay", $.GetContextPanel(), PlayMenu.ReadyForDisplay );
	$.RegisterEventHandler( "UnreadyForDisplay", $.GetContextPanel(), PlayMenu.UnreadyForDisplay );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", PlayMenu.SessionSettingsUpdate );
	$.RegisterForUnhandledEvent( "CSGOHideMainMenu", PlayMenu.OnHideMainMenu );
	$.RegisterForUnhandledEvent( "CSGOHidePauseMenu", PlayMenu.OnHideMainMenu );
	$.RegisterForUnhandledEvent( "CSGOShowMainMenu", PlayMenu.OnShowMainMenu );
	$.RegisterForUnhandledEvent( "CSGOShowPauseMenu", PlayMenu.OnShowMainMenu );
	$.RegisterForUnhandledEvent( "CSGOWorkshopSubscriptionsChanged", PlayMenu.WorkshopSubscriptionsChanged );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', PlayMenu.UpdatePrimeBtn );
} )();
