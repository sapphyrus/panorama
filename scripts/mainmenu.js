"use strict";

                                                                                                    
                                        
                                                                                                    

var MainMenu = ( function() {
	var _m_bPerfectWorld = ( MyPersonaAPI.GetLauncherType() === "perfectworld" );
	var _m_activeTab;
	var _m_sideBarElementContextMenuActive = false;
	var _m_elContentPanel = $( '#JsMainMenuContent' );
	var _m_playedInitalFadeUp = false;

	               
	var _m_elNotificationsContainer = $( '#NotificationsContainer' );
	var _m_notificationSchedule = false;
	var _m_bVanityAnimationAlreadyStarted = false;
	var _m_bHasPopupNotification = false;
	var _m_tLastSeenDisconnectedFromGC = 0;
	var _m_NotificationBarColorClasses = [
		"NotificationRed", "NotificationYellow", "NotificationGreen", "NotificationLoggingOn"
	];

	var _m_storePopupElement = null;
	var m_TournamentPickBanPopup = null;

	var _m_hOnEngineSoundSystemsRunningRegisterHandle = null;

	                                         
	let nNumNewSettings = UpdateSettingsMenuAlert();

	function UpdateSettingsMenuAlert()
	{ 
		let elNewSettingsAlert = $( "#MainMenuSettingsAlert" );
		if ( elNewSettingsAlert )
		{
			let nNewSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().length;
			elNewSettingsAlert.SetHasClass( "has-new-settings", nNewSettings > 0 );
			elNewSettingsAlert.SetDialogVariableInt( "num_settings", nNewSettings );
			return nNewSettings;
		}
		return 0;
	}

	if ( nNumNewSettings > 0 )
	{
		var hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", function () 
		{
			UpdateSettingsMenuAlert();
			$.UnregisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt );
		} );
	}

	var _OnInitFadeUp = function()
	{
		if( !_m_playedInitalFadeUp )
		{
			$( '#MainMenuContainerPanel' ).TriggerClass( 'show' );
			_m_playedInitalFadeUp = true;

			if ( GameInterfaceAPI.GetEngineSoundSystemsRunning() )
			{
				                                           
				                                                            
				_ShowOperationLaunchPopup();
			}
			else
			{
				                                                                                                                  
				_m_hOnEngineSoundSystemsRunningRegisterHandle = $.RegisterForUnhandledEvent( "PanoramaComponent_GameInterface_EngineSoundSystemsRunning", MainMenu.ShowOperationLaunchPopup );
			}
		}
	};

	var _SetBackgroundMovie = function()
	{
		var videoPlayer = $( '#MainMenuMovie' );
		if ( !( videoPlayer && videoPlayer.IsValid() ) )
			return;

		                                                                                                
		var backgroundMovie = GameInterfaceAPI.GetSettingString( 'ui_mainmenu_bkgnd_movie' );

		                                                                                     
		videoPlayer.SetAttributeString( 'data-type', backgroundMovie );

		                          
		videoPlayer.SetMovie( "file://{resources}/videos/" + backgroundMovie + ".webm" );
		videoPlayer.SetSound( 'UIPanorama.BG_' + backgroundMovie );
		videoPlayer.Play();

		                                                     
		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( vanityPanel && vanityPanel.IsValid() )
		{
			_SetVanityLightingBasedOnBackgroundMovie( vanityPanel );
		}
	};

	var _OnShowMainMenu = function()
	{
		$.DispatchEvent('PlayMainMenuMusic', true, true );

		                                         
		GameInterfaceAPI.SetSettingString( 'panorama_play_movie_ambient_sound', '1' );

		                                                                  
		                                          
		GameInterfaceAPI.SetSettingString( 'dsp_room', '29' );
		GameInterfaceAPI.SetSettingString( 'snd_soundmixer', 'MainMenu_Mix' );

		_m_bVanityAnimationAlreadyStarted = false;                                               
		_InitVanity();
		_OnInitFadeUp();
		_SetBackgroundMovie();

		                                                   
		$( '#MainMenuNavBarPlay' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', false );

		                                                    
		_UpdateOverwatch();

		_UpdateNotifications();
		_ShowWeaponUpdatePopup();
		_UpdateInventoryBtnAlert();

		                              
		_GcLogonNotificationReceived();

		                                                                          
		_DeleteSurvivalEndOfMatch();

		                                                               
		_ShowHideAlertForNewEventForWatchBtn();
	};

	var _TournamentDraftUpdate = function ()
	{
		if ( !m_TournamentPickBanPopup || !m_TournamentPickBanPopup.IsValid() )
		{
			m_TournamentPickBanPopup = UiToolkitAPI.ShowCustomLayoutPopup( 'tournament_pickban_popup', 'file://{resources}/layout/popups/popup_tournament_pickban.xml' );
		}
	}

	var _m_bGcLogonNotificationReceivedOnce = false;
	var _GcLogonNotificationReceived = function()
	{
		if ( _m_bGcLogonNotificationReceivedOnce ) return;
		
		var strFatalError = MyPersonaAPI.GetClientLogonFatalError();
		if ( strFatalError
			&& ( strFatalError !== "ShowGameLicenseNoOnlineLicensePW" )                                                                                               
			&& ( strFatalError !== "ShowGameLicenseNoOnlineLicense" )	                                                                                              
			)
		{
			_m_bGcLogonNotificationReceivedOnce = true;

			if ( strFatalError === "ShowGameLicenseNeedToLinkAccountsWithMoreInfo" )
			{
				UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( "#CSGO_Purchasable_Game_License_Short", "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts_WW_hint", "",
					"#UI_Yes", function() { SteamOverlayAPI.OpenURL( "https://community.csgo.com.cn/join/pwlink_csgo" ); },
					"#UI_No", function() {},
					"#ShowFAQ", function() { _OnGcLogonNotificationReceived_ShowFaqCallback(); },
					"dim" );
			}
			else if ( strFatalError === "ShowGameLicenseNeedToLinkAccounts" )
			{
				_OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts", "https://community.csgo.com.cn/join/pwlink_csgo" );
			}
			else if ( strFatalError === "ShowGameLicenseHasLicensePW" )
			{
				_OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_HasLicense_PW", "https://community.csgo.com.cn/join/pwlink_csgo?needlicense=1" );
			}
			else if ( strFatalError === "ShowGameLicenseNoOnlineLicensePW" )
			{
				                                                                                 
				                                                                                     
				                                 
				                                                                                                                                                           
			}
			else if ( strFatalError === "ShowGameLicenseNoOnlineLicense" )
			{
				                                                                                 
				                                                                                     
				                                 
				                                                                                                                                                 
			}
			else
			{
				UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "#SFUI_LoginPerfectWorld_Title_Error", strFatalError, "",
					"#GameUI_Quit", function() { GameInterfaceAPI.ConsoleCommand( "quit" ); },
					"dim" );
			}

			return;
		}
		
		var nAntiAddictionTrackingState = MyPersonaAPI.GetTimePlayedTrackingState();
		if ( nAntiAddictionTrackingState > 0 )
		{
			_m_bGcLogonNotificationReceivedOnce = true;

			var pszDialogTitle = "#SFUI_LoginPerfectWorld_Title_Info";
			var pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction1";
			var pszOverlayUrlToOpen = null;
			if ( nAntiAddictionTrackingState != 2                                        )
			{
				pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction2";
				pszOverlayUrlToOpen = "https://community.csgo.com.cn/join/pwcompleteaccountinfo";
			}
			if ( pszOverlayUrlToOpen )
			{
				UiToolkitAPI.ShowGenericPopupYesNo( pszDialogTitle, pszDialogMessageText, "",
					function() { SteamOverlayAPI.OpenURL( pszOverlayUrlToOpen ); },
					function() {} 
				);
			}
			else
			{
				UiToolkitAPI.ShowGenericPopup( pszDialogTitle, pszDialogMessageText, "" );
			}

			return;
		}
	}

	var _m_numGameMustExitNowForAntiAddictionHandled = 0;
	var _m_panelGameMustExitDialog = null;
	var _GameMustExitNowForAntiAddiction = function()
	{
		                                                                       
		if ( _m_panelGameMustExitDialog && _m_panelGameMustExitDialog.IsValid() ) return;

		                                                            
		if ( _m_numGameMustExitNowForAntiAddictionHandled >= 100 ) return;
		++ _m_numGameMustExitNowForAntiAddictionHandled;

		                                                                                       
		_m_panelGameMustExitDialog =
		UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "#GameUI_QuitConfirmationTitle", "#UI_AntiAddiction_ExitGameNowMessage", "",
					"#GameUI_Quit", function() { GameInterfaceAPI.ConsoleCommand( "quit" ); },
					"dim" );
		                                                                                  
	}

	var _OnGcLogonNotificationReceived_ShowLicenseYesNoBox = function ( strTextMessage, pszOverlayUrlToOpen )
	{
		 UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( "#CSGO_Purchasable_Game_License_Short", strTextMessage, "",
			"#UI_Yes", function() { SteamOverlayAPI.OpenURL( pszOverlayUrlToOpen ); },
			"#UI_No", function() {},
			"dim" );
	}

	var _OnGcLogonNotificationReceived_ShowFaqCallback = function ()
	{
		                         
		SteamOverlayAPI.OpenURL( "https://support.steampowered.com/kb_article.php?ref=6026-IFKZ-7043&l=schinese" );

		                                                                     
		_m_bGcLogonNotificationReceivedOnce = false;
		_GcLogonNotificationReceived();
	}

	var _OnHideMainMenu = function ()
	{
		                        
		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( vanityPanel )
		{
			CharacterAnims.CancelScheduledAnim( vanityPanel );
		}

		_CancelNotificationSchedule();

		UiToolkitAPI.CloseAllVisiblePopups();
	};

	var _OnShowPauseMenu = function()
	{
		var elContextPanel = $.GetContextPanel();
		
		elContextPanel.AddClass( 'MainMenuRootPanel--PauseMenuMode' );

		var bMultiplayer = elContextPanel.IsMultiplayer();
		var bQueuedMatchmaking = GameStateAPI.IsQueuedMatchmaking();
		var bTraining = elContextPanel.IsTraining();
		var bGotvSpectating = elContextPanel.IsGotvSpectating();
		var bIsCommunityServer = !_m_bPerfectWorld && MatchStatsAPI.IsConnectedToCommunityServer();

		                                                                        
		                                                                                                         
		$( '#MainMenuNavBarPlay' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', true );

		$( '#MainMenuNavBarSwitchTeams' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', ( bTraining || bQueuedMatchmaking || bGotvSpectating ) );
		
		                                                          
		                                                                                                                   
		                                                                                                                                                 
		$( '#MainMenuNavBarVote' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', ( bTraining ||                      bGotvSpectating ) );

		                                                                                        
		$( '#MainMenuNavBarReportServer' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', !bIsCommunityServer );

		                                                                                           
		$( '#MainMenuNavBarShowCommunityServerBrowser' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', !bIsCommunityServer );
		

		                                                            
		_UpdateSurvivalEndOfMatchInstance();

		                
		_OnHomeButtonPressed();
	};

	var _OnHidePauseMenu = function ()
	{
		$.GetContextPanel().RemoveClass( 'MainMenuRootPanel--PauseMenuMode' );

		_OnHomeButtonPressed();
	};

	var _BCheckTabCanBeOpenedRightNow = function( tab )
	{
		if ( tab === 'JsInventory' )
		{
			var restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
			if ( restrictions !== false )
			{
				LicenseUtil.ShowLicenseRestrictions( restrictions );
				return false;
			}
		}

		if ( tab === 'JsInventory' )
		{
			if ( !MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC() )
			{
				                                       
				UiToolkitAPI.ShowGenericPopupOk(
					$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
					$.Localize( '#SFUI_Steam_Error_LinkUnexpected' ),
					'',
					function() {},
					function() {}
				);
				return false;
			}
		}

		                          
		return true;
	}

	var _NavigateToTab = function( tab, XmlName )
	{
		                                                        
		                                                   

		if ( !_BCheckTabCanBeOpenedRightNow( tab ) )
		{
			_OnHomeButtonPressed();
			return;	                                                                               
		}

		$.DispatchEvent('PlayMainMenuMusic', true, false );

		                                    
		GameInterfaceAPI.SetSettingString( 'panorama_play_movie_ambient_sound', '0' );

		                                      
		                            
		if( !$.GetContextPanel().FindChildInLayoutFile( tab ) )
		{
			var newPanel = $.CreatePanel('Panel', _m_elContentPanel, tab );
			
			newPanel.Data().elMainMenuRoot = $.GetContextPanel();
			                                                 

			newPanel.BLoadLayout('file://{resources}/layout/' + XmlName + '.xml', false, false );
			newPanel.RegisterForReadyEvents( true );
			
			                                                                          
			                                                       
			newPanel.OnPropertyTransitionEndEvent = function ( panelName, propertyName )
			{
				if( newPanel.id === panelName && propertyName === 'opacity' )
				{
					                                         
					if( newPanel.visible === true && newPanel.BIsTransparent() )
					{
						                                               
						newPanel.visible = false;
						newPanel.SetReadyForDisplay( false );
						return true;
					}
					else if ( newPanel.visible === true )
					{
						$.DispatchEvent( 'MainMenuTabShown', tab );
					}
				}

				return false;
			};

			$.RegisterEventHandler( 'PropertyTransitionEnd', newPanel, newPanel.OnPropertyTransitionEndEvent );
		}
		
		                                                                               
		                             
		if( _m_activeTab !== tab )
		{
			                                       
			if(XmlName) {
				$.DispatchEvent('PlaySoundEffect', 'tab_' + XmlName.replace('/', '_'), 'MOUSE');
			}
			
			                                 
			if( _m_activeTab )
			{
				var panelToHide = $.GetContextPanel().FindChildInLayoutFile( _m_activeTab );
				panelToHide.AddClass( 'mainmenu-content--hidden' );

				                                       
			}
			
			                   
			_m_activeTab = tab;
			var activePanel = $.GetContextPanel().FindChildInLayoutFile( tab );
			activePanel.RemoveClass( 'mainmenu-content--hidden' );

			                                                                         
			activePanel.visible = true;
			activePanel.SetReadyForDisplay( true );
			                                      


			                                           	
			_PauseMainMenuCharacter();
		}

		_ShowContentPanel();
	};


	var _ShowContentPanel = function()
	{
		if ( _m_elContentPanel.BHasClass( 'mainmenu-content--offscreen' ) ) {
			_m_elContentPanel.RemoveClass( 'mainmenu-content--offscreen' );
		}

		$.DispatchEvent( 'ShowContentPanel' );
		_DimMainMenuBackground( false );
		_HideNewsAndStore();
	};

	var _OnHideContentPanel = function()
	{
		_m_elContentPanel.AddClass( 'mainmenu-content--offscreen' );

		                                                     
		var elActiveNavBarBtn = _GetActiveNavBarButton();
		if ( elActiveNavBarBtn && elActiveNavBarBtn.id !== 'MainMenuNavBarHome' ) {
			elActiveNavBarBtn.checked = false;
		}

		_DimMainMenuBackground( true );
		
		                                 
		if ( _m_activeTab )
		{
			var panelToHide = $.GetContextPanel().FindChildInLayoutFile( _m_activeTab );
			panelToHide.AddClass( 'mainmenu-content--hidden' );
			                                       
		}
		
		_m_activeTab = '';

		_ShowNewsAndStore();
	};

	var _GetActiveNavBarButton = function( )
	{
		var elNavBar = $( '#JsMainMenuNavBar' );
		var children = elNavBar.Children();
		var count = children.length;

		for (var i = 0; i < count; i++) 
		{
			if ( children[ i ].IsSelected() ) {
				return children[ i ];
			}
		}
	};

	                                                                                                    
	                                              
	                                                                                                    
	var _ShowHideNavDrawer = function()
	{
		UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_navdrawer.xml');
	};

	                              
	var _ExpandSidebar = function( AutoClose = false )
	{
		var elSidebar = $( '#JsMainMenuSidebar' );

		if(elSidebar.BHasClass( 'mainmenu-sidebar--minimized' ) ) {
			$.DispatchEvent( 'PlaySoundEffect', 'sidemenu_slidein', 'MOUSE' );
		}

		elSidebar.RemoveClass( 'mainmenu-sidebar--minimized' );

		$.DispatchEvent( 'SidebarIsCollapsed', false );
		_DimMainMenuBackground( false );

		if ( AutoClose )
		{
			$.Schedule( 1, _MinimizeSidebar );
		}
	};

	var _MinimizeSidebar = function()
	{
		                                                                                                 
		                                                                                               
		                           
		if ( _m_elContentPanel == null ) {
			return;
		}

		                                                                  
		                                    
		if ( _m_sideBarElementContextMenuActive ) {
			return;
		}
		
		var elSidebar = $( '#JsMainMenuSidebar' );

		if(!elSidebar.BHasClass( 'mainmenu-sidebar--minimized' ) ) {
			$.DispatchEvent( 'PlaySoundEffect', 'sidemenu_slideout', 'MOUSE' );
		}

		elSidebar.AddClass( 'mainmenu-sidebar--minimized' );

		                                                            
		                                                                    
		
		$.DispatchEvent( 'SidebarIsCollapsed', true );
		_DimMainMenuBackground( true );
	};

	var _OnSideBarElementContextMenuActive = function( bActive )
	{
		                                               
		_m_sideBarElementContextMenuActive = bActive;

		                                                                              
		                                                                      
		                                        
		var ContextMenuClosedOutsideSidebar = function ()
		{ 
			var isHover =  $( '#JsMainMenuSidebar' ).BHasHoverStyle();
			if( !isHover ) {
				_MinimizeSidebar();
			}
		};

		                                                                                       
		$.Schedule( 0.25, ContextMenuClosedOutsideSidebar );

		_DimMainMenuBackground( false );
	};

	var _DimMainMenuBackground = function( removeDim )
	{		
		if ( removeDim && _m_elContentPanel.BHasClass('mainmenu-content--offscreen') &&
			$('#mainmenu-content__blur-target').BHasHoverStyle() === false) {
			$('#MainMenuBackground').RemoveClass('Dim');
		} else
			$('#MainMenuBackground').AddClass('Dim');
	};

	                                                                                                    
	                         
	                                                                                                    

	function _OnHomeButtonPressed()
	{
		$.DispatchEvent( 'HideContentPanel' );

		                                            	
		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( vanityPanel )
		{
			vanityPanel.Pause( false );
		}
	}

	function _OnQuitButtonPressed()
	{	
		UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( '#UI_ConfirmExitTitle',
			'#UI_ConfirmExitMessage',
			'',
			'#UI_Quit',
			function() {
				QuitGame( 'Option1' );
			},
			'#UI_Return',
			function() {
			},
			'dim'
		);
	}

	function QuitGame( msg )
	{
		                                                 
		GameInterfaceAPI.ConsoleCommand('quit');
	}

	                                                                                                    
	                      
	                                                                                                    
	var _InitFriendsList = function( )
	{
		var friendsList = $.CreatePanel( 'Panel', $.FindChildInContext( '#mainmenu-sidebar__blur-target' ), 'JsFriendsList' );
		friendsList.BLoadLayout( 'file://{resources}/layout/friendslist.xml', false, false );
	};

	var _InitNewsAndStore = function ()
	{	
		                             
		_AddStream();
		
		                             
		var elNews = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsNewsPanel' );
		elNews.BLoadLayout( 'file://{resources}/layout/mainmenu_news.xml', false, false );
		
		                             
		var elStore = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsStorePanel' );
		elStore.BLoadLayout( 'file://{resources}/layout/mainmenu_store.xml', false, false );

		$.FindChildInContext( '#JsNewsContainer' ).OnPropertyTransitionEndEvent = function ( panelName, propertyName )
		{
			if( elNews.id === panelName && propertyName === 'opacity')
			{
				                                         
				if( elNews.visible === true && elNews.BIsTransparent() )
				{
					                                               
					elNews.visible = false;
					elNews.SetReadyForDisplay( false );
					return true;
				}
			}

			return false;
		};

		                            
		var bFeaturedPanelIsActive = true;
		
		if ( bFeaturedPanelIsActive )
		{
			_AddFeaturedPanel();
		}
		
		_AddWatchNoticePanel();	                             

		_ShowNewsAndStore();
	};

	var _AddStream = function()
	{
		var elStream = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsStreamPanel' );
		elStream.BLoadLayout( 'file://{resources}/layout/mainmenu_stream.xml', false, false );
	};

	var _AddFeaturedPanel = function()
	{
		                        
		                                                                       
		                                                                                     
		      

		                  
		var featuredXML = 'file://{resources}/layout/operation/operation_mainmenu.xml';
		var elPanel = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsFeaturedPanel' );
		elPanel.BLoadLayout( featuredXML, false, false );

		$.FindChildInContext( '#JsNewsContainer' ).MoveChildBefore( elPanel, $.FindChildInContext( '#JsNewsPanel' ) );

		                                                                                                 
		var overrideStyle = ( featuredXML.indexOf( 'tournament' ) !== -1 || featuredXML.indexOf( 'operation' ) !== -1 ) ? 
			'' : 
			'news-panel-style-feature-panel-visible';

		if( overrideStyle !== '' )
		{
			$.FindChildInContext( '#JsNewsContainer' ).SetHasClass( overrideStyle, true );
		}
	};

	var _HideMainMenuNewsPanel = function()
	{
		var elNews = $.FindChildInContext( '#JsNewsContainer' );
		elNews.SetHasClass( 'news-panel--hide-news-panel', true );

		if( elNews.BHasClass( 'news-panel-style-feature-panel-visible') )
		{
			elNews.RemoveClass( 'news-panel-style-feature-panel-visible', true );
		}
	}

	var _AddWatchNoticePanel = function()
	{
		var WatchNoticeXML = 'file://{resources}/layout/mainmenu_watchnotice.xml';
		var elPanel = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsWatchNoticePanel' );
		$.FindChildInContext( '#JsNewsContainer' ).MoveChildAfter( elPanel, $( "#JsNewsPanel") );
		elPanel.BLoadLayout( WatchNoticeXML, false, false );
	}
	
	var _ShowNewsAndStore = function ()
	{
		var elNews = $.FindChildInContext( '#JsNewsContainer' );
		elNews.SetHasClass( 'hidden', false );

		var elVanityButton = $.FindChildInContext( '#VanityControls' );
		if ( elVanityButton )
		{
			elVanityButton.visible = true;
		}

	};

	var _HideNewsAndStore = function ()
	{
		var elNews = $.FindChildInContext( '#JsNewsContainer' );
		elNews.SetHasClass( 'hidden', true );

		var elVanityButton = $.FindChildInContext( '#VanityControls' );

		if ( elVanityButton )
		{
			elVanityButton.visible = false;
		}

	};

	                                                                
	                                                             
	var _OnSteamIsPlaying = function()
    {
		var elNewsContainer = $.FindChildInContext( '#JsNewsContainer' );

		if ( elNewsContainer )
		{
			elNewsContainer.SetHasClass( 'mainmenu-news-container-stream-active', EmbeddedStreamAPI.IsVideoPlaying() );
		}
    };

    var _ResetNewsEntryStyle = function()
    {
		var elNewsContainer = $.FindChildInContext( '#JsNewsContainer' );

		if ( elNewsContainer )
		{
			elNewsContainer.RemoveClass( 'mainmenu-news-container-stream-active' );
		}
    };

	                                                                                                    
	                     
	                                                                                                    

	var _ForceRestartVanity = function()
	{
		_m_bVanityAnimationAlreadyStarted = false;
		_InitVanity();
	};

	                                                                 
	function _RigVanityHover ( vanityPanel )
	{
		if ( !vanityPanel || !vanityPanel.IsValid() )
			return;
		
		var elHover = $( "#id-mainmenu-vanity-hover" );

		if ( !elHover || !elHover.IsValid )
			return;
		
		                                                                       

		                                                                         
		
		var OnMouseOver = function()
        {
			if ( $( '#VanityControls' ) )
			{
				$( '#VanityControls' ).AddClass( 'pulse-vanity-controls')
			}
		};
		
		var OnMouseOut = function()
        {
			if ( $( '#VanityControls' ) )
			{
				$( '#VanityControls' ).RemoveClass( 'pulse-vanity-controls')
			}
        };
        
		elHover.SetPanelEvent( 'onmouseover', OnMouseOver );
		elHover.SetPanelEvent( 'onmouseout', OnMouseOut );
	}

	var _InitVanity = function()
	{
		                               
		if ( !MyPersonaAPI.IsInventoryValid() ) {
			                                                
			return;
		}
		if ( _m_bVanityAnimationAlreadyStarted ) {
			                                                                         
			return;
		}

		  
		                                                      
		  
		var oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
		oSettings.activity = 'ACT_CSGO_UIPLAYER_WALKUP';
		oSettings.arrModifiers.push( 'vanity' );

		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( !vanityPanel )
		{
			                                                                 
			return;
		}
		oSettings.panel = vanityPanel;

		                                         
		vanityPanel.SetSceneAngles( 0, 0, 0, true );
		
		                                                                          
		vanityPanel.hittest = false; 

		  
		                               
		  
		                                                        
		_m_bVanityAnimationAlreadyStarted = true;
		
		CharacterAnims.PlayAnimsOnPanel( oSettings );


		_SetVanityLightingBasedOnBackgroundMovie( vanityPanel );

		if ( oSettings.panel.BHasClass( 'hidden' ) ) {
			oSettings.panel.RemoveClass( 'hidden' );
		}

		_RigVanityHover( vanityPanel );

		                                                                       
		$.Schedule( 3.0, function() {if (vanityPanel && vanityPanel.IsValid() ) vanityPanel.hittest = true;} );

	};


	var _SetVanityLightingBasedOnBackgroundMovie = function( vanityPanel )
	{
		var backgroundMap = $.GetContextPanel().FindChildInLayoutFile( 'MainMenuMovie' ).GetAttributeString( 'data-type', 'anubis' );

		                                                                                                  
		                                                                             
		                                                                                    
		                                                                                   
		                                                                

		                                                                                                                 
		vanityPanel.RestoreLightingState();

		if ( backgroundMap === 'cbble' )
		{
			vanityPanel.SetFlashlightAmount( 1.0 );
			                                               
			                                                            
			                                                           
			vanityPanel.SetFlashlightColor( 0.81, 0.92, 1.00 );
			vanityPanel.SetAmbientLightColor( 0.12, 0.21, 0.46 );

			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor( 0.13, 0.14, 0.13 );
			vanityPanel.SetDirectionalLightDirection( -0.81, 0.41, 0.43 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.82, 0.19, 0.08 );
			vanityPanel.SetDirectionalLightDirection( 0.62, 0.74, -0.25 );
			vanityPanel.SetDirectionalLightPulseFlicker( 0.25, 0.25, 0.25, 0.25 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.72, 1.40, 1.68 );
			vanityPanel.SetDirectionalLightDirection( 0.50, -0.69, -0.52 );

			                                                   
		}
		else if ( backgroundMap === 'blacksite' )
		{
			vanityPanel.SetFlashlightAmount( 1 );
			                                               
			                                                           
			                                                            
			vanityPanel.SetFlashlightColor( 4, 4, 4);
			vanityPanel.SetAmbientLightColor( 0.16, 0.26, 0.30 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor( 0.26, 0.35, 0.47 );
			vanityPanel.SetDirectionalLightDirection( -0.50, 0.80, 0.00 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.74, 1.01, 1.36 );
			vanityPanel.SetDirectionalLightDirection( 0.47, -0.77, -0.42 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.75, 1.20, 1.94 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
		else if ( backgroundMap === 'sirocco_night' )
		{
			vanityPanel.SetFlashlightAmount( 2 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 45 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.13, 0.17, 0.29 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.22, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
	};

	                                                                           
	var _OnEquipSlotChanged = function( slot, oldItemID, newItemID )
	{
	};

	var _OpenPlayMenu = function ()
	{
		                                                      
		if ( MatchStatsAPI.GetUiExperienceType() )
			return;

		_InsureSessionCreated();
		_NavigateToTab( 'JsPlay', 'mainmenu_play' );

		                                           	
		_PauseMainMenuCharacter();		
	};

	var _OpenWatchMenu = function()
	{
		_PauseMainMenuCharacter();
		_NavigateToTab( 'JsWatch', 'mainmenu_watch' );
	}

	var _OpenInventory = function ()
	{
		                                           	
		_PauseMainMenuCharacter();
		_NavigateToTab( 'JsInventory', 'mainmenu_inventory' );
	};

	var _OpenStatsMenu = function()
	{
		                                           	
		_PauseMainMenuCharacter();
		_NavigateToTab('JsPlayerStats', 'mainmenu_playerstats');
	};

	var _OpenSettings = function()
	{
		MainMenu.NavigateToTab('JsSettings', 'settings/settings');
	}

	var _InsureSessionCreated = function()
	{
		if ( !LobbyAPI.IsSessionActive() )
		{
			LobbyAPI.CreateSession();
		}
	};

	var _OnEscapeKeyPressed = function( eSource, nRepeats, focusPanel )
	{
		                                
		if ( $.GetContextPanel().BHasClass( 'MainMenuRootPanel--PauseMenuMode' ) ) {
			$.DispatchEvent( 'CSGOMainMenuResumeGame' );
		}
		else {
			MainMenu.OnHomeButtonPressed();

			var elPlayButton = $( '#MainMenuNavBarPlay' );
			if( elPlayButton && !elPlayButton.BHasClass( 'mainmenu-navbar__btn-small--hidden' ) ) {

				GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '1');
				$.DispatchEvent( 'PlaySoundEffect', 'mainmenu_press_home', 'MOUSE' );
				$.DispatchEvent('PlayMainMenuMusic', true, true );
			}
		}
	};

	                                                                                                    
	                    
	                                                                                                    
	var _InventoryUpdated = function()
	{
		_ForceRestartVanity();
		_UpdateInventoryBtnAlert();
	};

	var _UpdateInventoryBtnAlert = function()
	{
		var aNewItems = AcknowledgeItems.GetItems();

		                                                                                                                
		                                                                                  
		                                                                                              
		                                                                                       
		    
		   	                                
		    
		
		var count = aNewItems.length;
		var elNavBar = $.GetContextPanel().FindChildInLayoutFile('JsMainMenuNavBar'),
		elAlert = elNavBar.FindChildInLayoutFile('MainMenuInvAlert');

		elAlert.FindChildInLayoutFile('MainMenuInvAlertText').text = count;
		elAlert.SetHasClass( 'hidden', count < 1 );
	};

	var JsInspectCallback = -1;

	var _OnInventoryInspect = function( id )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true',
			'none'
		);
	};

	var _OnShowXrayCasePopup = function( toolid, caseId, bShowPopupWarning = false )
	{
		var showpopup = bShowPopupWarning ? 'yes' : 'no';
		
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_decodable.xml',
			'key-and-case=' + toolid + ',' + caseId +
			'&' + 'asyncworktype=decodeable' +
			'&' + 'isxraymode=yes' +
			'&' + 'showxraypopup='+showpopup
		);
	};

	var JsInspectCallback = -1;
	var _OnLootlistItemPreview = function( id, params )
	{
		if ( JsInspectCallback != -1 )
		{
			UiToolkitAPI.UnregisterJSCallback( JsInspectCallback );
			JsInspectCallback = -1;
		}
		                            
		var ParamsList = params.split( ',' );
		var keyId = ParamsList[ 0 ];
		var caseId = ParamsList[ 1 ];
		var storeId = ParamsList[ 2 ];
		var blurOperationPanel = ParamsList[ 3 ];
		                                                                                    
		var aParamsForCallback = ParamsList.slice( 4 );
		var showMarketLinkDefault = _m_bPerfectWorld ? 'false' : 'true';

		JsInspectCallback = UiToolkitAPI.RegisterJSCallback( _OpenDecodeAfterInspect.bind( undefined, keyId, caseId, storeId, aParamsForCallback ) );

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true' +
			'&' + 'allowsave=false' +
			'&' + 'showequip=false' +
			'&' + 'showitemcert=false' +
			'&' + blurOperationPanel +
			'&' + 'showmarketlink=' + showMarketLinkDefault +
			'&' + 'callback=' + JsInspectCallback,
			'none'
		);
	};

	var _OpenDecodeAfterInspect = function( keyId, caseId, storeId, aParamsForCallback )
	{
		                                                                                                               
		                                                                                    
		                              
		var backtostoreiteminspectsettings = storeId ?
			'&' + 'asyncworkitemwarning=no' +
			'&' + 'asyncforcehide=true' +
			'&' + 'storeitemid=' + storeId :
			'';

		var backtodecodeparams = aParamsForCallback.length > 0 ?
		'&' + aParamsForCallback.join( '&' ) : 
		'';

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_decodable.xml',
			'key-and-case=' + keyId + ',' + caseId +
			'&' + 'asyncworktype=decodeable' +
			backtostoreiteminspectsettings +
			backtodecodeparams
		);
	};

	var _WeaponPreviewRequest = function( id )
	{
		UiToolkitAPI.CloseAllVisiblePopups();

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true' +
			'&' + 'allowsave=false' +
			'&' + 'showequip=false' +
			'&' + 'showitemcert=true',
			'none'
		);
	};

	var _UpdateOverwatch = function()
	{
		var strCaseDescription = OverwatchAPI.GetAssignedCaseDescription();
		$( '#MainMenuNavBarOverwatch' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', strCaseDescription == "" );
	};

	function _CancelNotificationSchedule()
	{
		if ( _m_notificationSchedule !== false )
		{
			$.CancelScheduled( _m_notificationSchedule );
			_m_notificationSchedule = false;
		}
	}

	function _AcknowledgePenaltyNotificationsCallback()
	{
		CompetitiveMatchAPI.ActionAcknowledgePenalty();

		_m_bHasPopupNotification = false;
	}

	function _AcknowledgeMsgNotificationsCallback()
	{
		MyPersonaAPI.ActionAcknowledgeNotifications();

		_m_bHasPopupNotification = false;
	}

	function _GetPopupNotification()
	{
		var popupNotification = {
			title: "",
			msg: "",
			color_class: "NotificationYellow",
			callback: function() {},
			html: false
		};
		
		var nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
		if ( nBanRemaining < 0 )
		{
			popupNotification.title = "#SFUI_MainMenu_Competitive_Ban_Confirm_Title";
			popupNotification.msg = $.Localize( "#SFUI_CooldownExplanationReason_Expired_Cooldown" ) + $.Localize( CompetitiveMatchAPI.GetCooldownReason() );
			popupNotification.callback = _AcknowledgePenaltyNotificationsCallback;
			popupNotification.html = true;

			return popupNotification;
		}

		var strNotifications = MyPersonaAPI.GetMyNotifications();
		if ( strNotifications !== "" )
		{
			var arrayOfNotifications = strNotifications.split( ',' );
			arrayOfNotifications.forEach( function( notificationType )
			{
				if ( notificationType != 6 )
				{
					popupNotification.color_class = 'NotificationBlue';
				}
				popupNotification.title = '#SFUI_PersonaNotification_Title_' + notificationType;
				popupNotification.msg = '#SFUI_PersonaNotification_Msg_' + notificationType;
				popupNotification.callback = _AcknowledgeMsgNotificationsCallback;

				return true;
			} );

			return popupNotification;
		}

		return null;
	}

	function _UpdatePopupnotification()
	{
		                                                                       
		if ( !_m_bHasPopupNotification )
		{
			var popupNotification = _GetPopupNotification();
			if ( popupNotification != null )
			{
				var elPopup = UiToolkitAPI.ShowGenericPopupOneOption(
					popupNotification.title,
					popupNotification.msg,
					popupNotification.color_class,
					'#SFUI_MainMenu_ConfirmBan',
					popupNotification.callback
				);
				
				                                                       
				if ( popupNotification.html )
					elPopup.EnableHTML();

				_m_bHasPopupNotification = true;
			}
		}
	}

	function _GetNotificationBarData()
	{
		var notification = { color_class: "", title: "", tooltip: "" };

		if ( LicenseUtil.GetCurrentLicenseRestrictions() === false )
		{
			  
			                                                                                              
			  
			var bIsConnectedToGC = MyPersonaAPI.IsConnectedToGC();
			$( '#MainMenuInput' ).SetHasClass( 'GameClientConnectingToGC', !bIsConnectedToGC );
			if ( bIsConnectedToGC )
			{	                                                                 
				_m_tLastSeenDisconnectedFromGC = 0;
			}
			else if ( !_m_tLastSeenDisconnectedFromGC )
			{	                                                                          
				_m_tLastSeenDisconnectedFromGC = + new Date();                                                          
			}
			else if ( Math.abs( ( + new Date() ) - _m_tLastSeenDisconnectedFromGC ) > 7000 )
			{	                                           
				notification.color_class = "NotificationLoggingOn";
				notification.title = $.Localize( "#Store_Connecting_ToGc" );
				notification.tooltip = $.Localize( "#Store_Connecting_ToGc_Tooltip" );
				return notification;
			}
		}

		  
		                             
		  
		var nIsVacBanned = MyPersonaAPI.IsVacBanned();
		if ( nIsVacBanned != 0 )
		{
			notification.color_class = "NotificationRed";

			if ( nIsVacBanned == 1 )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Vac_Title" );
				notification.tooltip = $.Localize( "#SFUI_MainMenu_Vac_Info" );
			}
			else
			{
				notification.title = $.Localize( "#SFUI_MainMenu_GameBan_Title" );
				notification.tooltip = $.Localize( "#SFUI_MainMenu_GameBan_Info" );
			}
			
			return notification;
		}

		  
		                                  
		  
		if ( NewsAPI.IsNewClientAvailable() )
		{
			notification.color_class = "NotificationYellow";
			notification.title = $.Localize( "#SFUI_MainMenu_Outofdate_Title" );
			notification.tooltip = $.Localize( "#SFUI_MainMenu_Outofdate_Body" );

			return notification;
		}	
		
		  
		                             
		  
		var nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
		if ( nBanRemaining > 0 )
		{
			notification.tooltip = CompetitiveMatchAPI.GetCooldownReason();

			var strType = CompetitiveMatchAPI.GetCooldownType();
			if ( strType == "global" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Global_Ban_Title" );
				notification.color_class = "NotificationRed";
			}
			else if ( strType == "green" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Temporary_Ban_Title" );
				notification.color_class = "NotificationGreen";
			}
			else if ( strType == "competitive" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Competitive_Ban_Title" );
				notification.color_class = "NotificationYellow";
			}
			
			                                                                                                                
			if ( nBanRemaining <= 49*24*3600 )
			{
				notification.title = notification.title + ' ' + FormatText.SecondsToSignificantTimeString( nBanRemaining );
			}

			return notification;
		}	

		return null;
	}

	function _UpdateNotificationBar()
	{
		var notification = _GetNotificationBarData();

		                   
		_m_NotificationBarColorClasses.forEach( function ( strColorClass )
		{
			var bVisibleColor = false;
			if ( notification !== null )
			{
				bVisibleColor = strColorClass === notification.color_class;
			}
			_m_elNotificationsContainer.SetHasClass( strColorClass, bVisibleColor );
		} );

		                         
		if ( notification !== null )
		{
			$.FindChildInContext( '#MainMenuNotificationTitle' ).text = notification.title;
		}

		_m_elNotificationsContainer.SetHasClass( 'hidden', notification === null );
	}

	var _UpdateNotifications = function()
	{
		_m_notificationSchedule = $.Schedule( 1.0, _UpdateNotifications );

		_UpdatePopupnotification();
		_UpdateNotificationBar();
	};


	                                                                                                    
	                    
	                                                                                                    
	var _m_acknowledgePopupHandler = null;
	var _ShowAcknowledgePopup = function( type = '', itemid = '' )
	{
		if ( type === 'xpgrant' )
		{	                                                 
			UiToolkitAPI.ShowCustomLayoutPopupParameters( 
				'',
				'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml',
				'none'
			);
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE' );
			return;
		}

		var updatedItemTypeAndItemid = '';
		if ( itemid && type )
			updatedItemTypeAndItemid = 'ackitemid=' + itemid + '&acktype=' + type;
			
		if( !_m_acknowledgePopupHandler ) {
			var jsPopupCallbackHandle;
			jsPopupCallbackHandle = UiToolkitAPI.RegisterJSCallback( MainMenu.ResetAcknowlegeHandler );

			_m_acknowledgePopupHandler = UiToolkitAPI.ShowCustomLayoutPopupParameters( 
				'',
				'file://{resources}/layout/popups/popup_acknowledge_item.xml',
				updatedItemTypeAndItemid + '&callback=' + jsPopupCallbackHandle
			);

			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE' );
		}
	};

	var _ResetAcknowlegeHandler = function()
	{
		_m_acknowledgePopupHandler = null;
	};

	var _ShowNotificationBarTooltip = function ()
	{
		var notification = _GetNotificationBarData();
		if ( notification !== null )
		{
			UiToolkitAPI.ShowTextTooltip( 'NotificationsContainer', notification.tooltip );
		}
	};

	var _ShowVote = function ()
	{
		var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'MainMenuNavBarVote',
			'',
			'file://{resources}/layout/context_menus/context_menu_vote.xml',
			'',
			function()
			{
				                                    
			}
		);
		contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
	};

	var _HideStoreStatusPanel = function () {
		if (_m_storePopupElement && _m_storePopupElement.IsValid()) {
			_m_storePopupElement.DeleteAsync(0);
		}

		_m_storePopupElement = null;
	};

	var _ShowStoreStatusPanel = function (strText, bAllowClose, bCancel, strOkCmd)
	{
		_HideStoreStatusPanel();

		var paramclose = '0';
		if (bAllowClose) {
			paramclose = '1';
		}

		var paramcancel = '0';
		if (bCancel) {
			paramcancel = '1';
		}

		_m_storePopupElement = UiToolkitAPI.ShowCustomLayoutPopupParameters(
            'store_popup',
            'file://{resources}/layout/popups/popup_store_status.xml',
			'text=' + $.UrlEncode( strText ) +
			'&' + 'allowclose=' + paramclose +
			'&' + 'cancel=' + paramcancel +
			'&'+'okcmd=' + $.UrlEncode( strOkCmd ) );
	};

	var _ShowWeaponUpdatePopup = function()
	{
		return;                                                         
		var setVersionTo = '1';
		var currentVersion = GameInterfaceAPI.GetSettingString( 'ui_popup_weaponupdate_version' );

		if ( currentVersion !== setVersionTo )
		{
			                      
			$.Schedule( 1.75, showMp5Popup );

			function showMp5Popup ()
			{
				var defIndex = 23;
				UiToolkitAPI.ShowCustomLayoutPopupParameters(
					'',
					'file://{resources}/layout/popups/popup_weapon_update.xml',
					'defindex=' + defIndex +
					'&' + 'uisettingversion=' + setVersionTo,
					'none'
				);
			}
		}
	};

	var _ShowOperationLaunchPopup = function()
	{
		if ( _m_hOnEngineSoundSystemsRunningRegisterHandle )
		{
			                                                                                                    
			$.UnregisterForUnhandledEvent( "PanoramaComponent_GameInterface_EngineSoundSystemsRunning", _m_hOnEngineSoundSystemsRunningRegisterHandle );
			_m_hOnEngineSoundSystemsRunningRegisterHandle = null;
		}

		var setVersionTo = '2';
		var currentVersion = GameInterfaceAPI.GetSettingString( 'ui_popup_weaponupdate_version' );

		if ( currentVersion !== setVersionTo )
		{
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/popups/popup_operation_launch.xml',
				'uisettingversion=' + setVersionTo,
				'none'
			);
		}

		                                                                                   
		var elCoverPlaque = $( '#MainMenuFullScreenBlackCoverPlaque' );
		if ( elCoverPlaque )
			elCoverPlaque.visible = false;
	};

	var _PauseMainMenuCharacter = function()
	{
		var vanityPanel = $( '#JsMainmenu_Vanity' );

		if ( vanityPanel && UiToolkitAPI.IsPanoramaInECOMode() )
		{
			vanityPanel.Pause( true );
		}
	}

	var _ShowTournamentStore = function() 
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_tournament_store.xml',
			'',
			'none'
		);
	}; 
	
	                                                                                                    
	                                                
	                                                                                                    
	var _ResetSurvivalEndOfMatch = function()
	{
		_DeleteSurvivalEndOfMatch();

		function CreateEndOfMatchPanel ()
		{
			var elPanel = $( '#PauseMenuSurvivalEndOfMatch' );

			if ( !elPanel )
			{
				elPanel = $.CreatePanel(
					'CSGOSurvivalEndOfMatch',
					$( '#MainMenuBackground' ),
					'PauseMenuSurvivalEndOfMatch',
					{
						class: 'PauseMenuModeOnly'
					}
				);

				elPanel.SetAttributeString( 'pausemenu', 'true' );
			}

			_UpdateSurvivalEndOfMatchInstance();
		}

		$.Schedule( 0.1, CreateEndOfMatchPanel );
	};

	var _DeleteSurvivalEndOfMatch = function()
	{
		if ( $( '#PauseMenuSurvivalEndOfMatch' ) )
		{
			$( '#PauseMenuSurvivalEndOfMatch' ).DeleteAsync( 0.0 );
		}
	};

	function _UpdateSurvivalEndOfMatchInstance()
	{
		var elSurvivalPanel = $( '#PauseMenuSurvivalEndOfMatch' );

		if ( elSurvivalPanel && elSurvivalPanel.IsValid() )
		{
			$( '#PauseMenuSurvivalEndOfMatch' ).matchStatus.UpdateFromPauseMenu();
		}
	}

	var _ShowHideAlertForNewEventForWatchBtn = function()
	{
		                                                                               
		                                                                
		  
		                                                                                  
		                                                    
		  
		                                            
	};

	var _WatchBtnPressedUpdateAlert = function()
	{
		                                                                        
		_ShowHideAlertForNewEventForWatchBtn();
	};

	function _SwitchVanity ( team )
	{
		$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE' );
		GameInterfaceAPI.SetSettingString( 'ui_vanitysetting_team', team );	
		_ForceRestartVanity();
	}

	function _GoToCharacterLoadout ( team )
	{
		_OpenInventory();

		$.DispatchEvent( "ShowLoadoutForItem", 'customplayer', 'customplayer', team );
	}

	                                                                                                    
	function _OnGoToCharacterLoadoutPressed ()
	{
		if ( !MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC() )
		{
			                                       
			UiToolkitAPI.ShowGenericPopupOk(
				$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
				$.Localize( '#SFUI_Steam_Error_LinkUnexpected' ),
				'',
				function() {},
				function() {}
			);
			return;
		}

		var team = GameInterfaceAPI.GetSettingString( 'ui_vanitysetting_team' ) == 't' ? 2 : 3;

		var elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'id-vanity-contextmenu',
			'',
			'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 
			'team=' + team,
			function(){}
		)

		elVanityContextMenu.AddClass( "ContextMenu_NoArrow" );
	}


	return {
		OnInitFadeUp						: _OnInitFadeUp,
		OnShowMainMenu						: _OnShowMainMenu,
		OnHideMainMenu	 					: _OnHideMainMenu,
		OnShowPauseMenu	 					: _OnShowPauseMenu,
		OnHidePauseMenu	 					: _OnHidePauseMenu,
		NavigateToTab	 					: _NavigateToTab,
		ShowContentPanel	 				: _ShowContentPanel,
		OnHideContentPanel	 				: _OnHideContentPanel,
		GetActiveNavBarButton	 			: _GetActiveNavBarButton,
		ShowHideNavDrawer	 				: _ShowHideNavDrawer,
		ExpandSidebar	 					: _ExpandSidebar,
		MinimizeSidebar	 					: _MinimizeSidebar,
		OnSideBarElementContextMenuActive	: _OnSideBarElementContextMenuActive,
		InitFriendsList	 					: _InitFriendsList,
		InitNewsAndStore					: _InitNewsAndStore,
		InitVanity							: _InitVanity,
		ForceRestartVanity	 				: _ForceRestartVanity,
		OnEquipSlotChanged	 				: _OnEquipSlotChanged,
		OpenPlayMenu						: _OpenPlayMenu,
		OpenWatchMenu						: _OpenWatchMenu,
		OpenStatsMenu						: _OpenStatsMenu,
		OpenInventory						: _OpenInventory,
		OpenSettings						: _OpenSettings,
		OnHomeButtonPressed					: _OnHomeButtonPressed,
		OnQuitButtonPressed					: _OnQuitButtonPressed,
		OnEscapeKeyPressed					: _OnEscapeKeyPressed,
		GameMustExitNowForAntiAddiction		: _GameMustExitNowForAntiAddiction,
		GcLogonNotificationReceived			: _GcLogonNotificationReceived,
		InventoryUpdated					: _InventoryUpdated,
		OnInventoryInspect					: _OnInventoryInspect,
		OnShowXrayCasePopup					: _OnShowXrayCasePopup,
		WeaponPreviewRequest				: _WeaponPreviewRequest,
		OnLootlistItemPreview				: _OnLootlistItemPreview,
		UpdateOverwatch						: _UpdateOverwatch,
		UpdateNotifications					: _UpdateNotifications,
		ShowAcknowledgePopup				: _ShowAcknowledgePopup,
		ShowOperationLaunchPopup			: _ShowOperationLaunchPopup,
		ResetAcknowlegeHandler				: _ResetAcknowlegeHandler,
		ShowNotificationBarTooltip			: _ShowNotificationBarTooltip,
		ShowVote 							: _ShowVote,
		ShowStoreStatusPanel				: _ShowStoreStatusPanel,
		HideStoreStatusPanel				: _HideStoreStatusPanel,
		SetBackgroundMovie					: _SetBackgroundMovie,
		PauseMainMenuCharacter				: _PauseMainMenuCharacter,
		ShowTournamentStore					: _ShowTournamentStore,
		TournamentDraftUpdate				: _TournamentDraftUpdate,
		ResetSurvivalEndOfMatch				: _ResetSurvivalEndOfMatch,
		OnGoToCharacterLoadoutPressed		: _OnGoToCharacterLoadoutPressed,
		ResetNewsEntryStyle					: _ResetNewsEntryStyle,
		OnSteamIsPlaying					: _OnSteamIsPlaying,
		WatchBtnPressedUpdateAlert			: _WatchBtnPressedUpdateAlert,
		HideMainMenuNewsPanel				: _HideMainMenuNewsPanel,
		SwitchVanity						: _SwitchVanity,
		GoToCharacterLoadout				: _GoToCharacterLoadout,
	};
})();


                                                                                                    
                                           
                                                                                                    
(function()
{
	$.RegisterForUnhandledEvent( 'HideContentPanel', MainMenu.OnHideContentPanel );
	$.RegisterForUnhandledEvent( 'SidebarContextMenuActive', MainMenu.OnSideBarElementContextMenuActive );

	$.RegisterForUnhandledEvent( 'OpenPlayMenu', MainMenu.OpenPlayMenu );
	$.RegisterForUnhandledEvent( 'OpenInventory', MainMenu.OpenInventory );
	$.RegisterForUnhandledEvent( 'OpenWatchMenu', MainMenu.OpenWatchMenu );
	$.RegisterForUnhandledEvent( 'OpenStatsMenu', MainMenu.OpenStatsMenu );
	$.RegisterForUnhandledEvent( 'CSGOShowMainMenu', MainMenu.OnShowMainMenu);
	$.RegisterForUnhandledEvent( 'CSGOHideMainMenu', MainMenu.OnHideMainMenu);
	$.RegisterForUnhandledEvent( 'CSGOShowPauseMenu', MainMenu.OnShowPauseMenu);
	$.RegisterForUnhandledEvent( 'CSGOHidePauseMenu', MainMenu.OnHidePauseMenu);
	$.RegisterForUnhandledEvent( 'OpenSidebarPanel', MainMenu.ExpandSidebar);
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_GameMustExitNowForAntiAddiction', MainMenu.GameMustExitNowForAntiAddiction );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_GcLogonNotificationReceived', MainMenu.GcLogonNotificationReceived );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', MainMenu.InventoryUpdated );
	$.RegisterForUnhandledEvent( 'InventoryItemPreview', MainMenu.OnInventoryInspect );
	$.RegisterForUnhandledEvent( 'LootlistItemPreview', MainMenu.OnLootlistItemPreview );
	$.RegisterForUnhandledEvent( 'ShowXrayCasePopup', MainMenu.OnShowXrayCasePopup );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Inventory_WeaponPreviewRequest', MainMenu.WeaponPreviewRequest );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Overwatch_CaseUpdated', MainMenu.UpdateOverwatch );
	$.RegisterForUnhandledEvent( "PanoramaComponent_TournamentMatch_DraftUpdate", MainMenu.TournamentDraftUpdate );

	$.RegisterForUnhandledEvent( 'ShowAcknowledgePopup', MainMenu.ShowAcknowledgePopup );
    $.RegisterForUnhandledEvent( 'ShowStoreStatusPanel', MainMenu.ShowStoreStatusPanel );
	$.RegisterForUnhandledEvent( 'HideStoreStatusPanel', MainMenu.HideStoreStatusPanel );

	$.RegisterForUnhandledEvent( 'ShowVoteContextMenu', MainMenu.ShowVote );
	$.RegisterForUnhandledEvent( 'ShowTournamentStore', MainMenu.ShowTournamentStore );

  	                                                                                     
	$.RegisterForUnhandledEvent( 'UnloadLoadingScreenAndReinit', MainMenu.ResetSurvivalEndOfMatch );

	$.RegisterForUnhandledEvent( 'MainMenu_OnGoToCharacterLoadoutPressed', MainMenu.OnGoToCharacterLoadoutPressed );
	$.RegisterForUnhandledEvent( "PanoramaComponent_EmbeddedStream_VideoPlaying", MainMenu.OnSteamIsPlaying );
	$.RegisterForUnhandledEvent( "StreamPanelClosed", MainMenu.ResetNewsEntryStyle );
	$.RegisterForUnhandledEvent( "HideMainMenuNewsPanel", MainMenu.HideMainMenuNewsPanel );

	$.RegisterForUnhandledEvent( "ForceRestartVanity", MainMenu.ForceRestartVanity );

	$.RegisterForUnhandledEvent( "CSGOMainInitBackgroundMovie", MainMenu.SetBackgroundMovie );
	$.RegisterForUnhandledEvent( "MainMenuGoToSettings", MainMenu.OpenSettings );
	$.RegisterForUnhandledEvent( "MainMenuSwitchVanity", MainMenu.SwitchVanity );
	$.RegisterForUnhandledEvent( "MainMenuGoToCharacterLoadout", MainMenu.GoToCharacterLoadout );
	
	MainMenu.MinimizeSidebar();
	MainMenu.InitVanity();
	MainMenu.MinimizeSidebar();
	MainMenu.InitFriendsList();
	MainMenu.InitNewsAndStore();


	                                                                                  
	$.RegisterEventHandler( "Cancelled", $.GetContextPanel(), MainMenu.OnEscapeKeyPressed );

})();
