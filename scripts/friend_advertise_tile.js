'use strict';

var FriendAdvertiseTile = ( function (){

	var _m_xuid = '';

	var _Init = function ( elTile )
	{
		_m_xuid = elTile.GetAttributeString( 'xuid', '(not found)' );
		var lobbyType = PartyBrowserAPI.GetPartyType( _m_xuid );
		var gameMode = PartyBrowserAPI.GetPartySessionSetting( _m_xuid,'game/mode' );

		_SetNameAvatar( elTile );
		                                                  
		_SetPrime( elTile );
		_SetFlag( elTile );
		_SetSkillGroup( elTile, gameMode );
		_SetInvitedFromCallback( elTile );
		_ShowInviteButton( elTile );
		_OnInviteSetPanelEvent( elTile );
		                                         
	}

	var _SetNameAvatar = function ( elTile )
	{
		var xuidLobbyLeader = PartyBrowserAPI.GetPartyMemberXuid( _m_xuid, 0 );

		elTile.SetDialogVariable( 'friendname', FriendsListAPI.GetFriendName( xuidLobbyLeader ) );
		elTile.FindChildTraverse( 'JsFriendAvatar' ).steamid = xuidLobbyLeader;
		elTile.FindChildTraverse( 'JsFriendAvatarBtn' ).SetPanelEvent( 'onactivate', _OpenContextMenu.bind( undefined, xuidLobbyLeader ));
	};

	var _SetPrime = function ( elTile )
	{
		var primeValue = PartyBrowserAPI.GetPartySessionSetting( _m_xuid, 'game/apr' );
		elTile.FindChildTraverse( 'JsFriendAdvertisePrime' ).visible = ( primeValue && primeValue != '0' ) ? true : false;
	};

	var _SetFlag = function ( elTile )
	{
		var countryCode = PartyBrowserAPI.GetPartySessionSetting( _m_xuid, 'game/loc' );
		var elFlagImg = elTile.FindChildTraverse( 'JsFriendAdvertiseFlag' );
		if ( countryCode )
		{
			elFlagImg.SetImage( 'file://{images}/flags/'+ countryCode +'.png' );
			elFlagImg.RemoveClass( 'hidden' );
		}
		else
		{
			elFlagImg.AddClass( 'hidden' );
		}
	};

	var _SetSkillGroup = function ( elTile, gameMode )
	{
		var skillGroup = PartyBrowserAPI.GetPartySessionSetting( _m_xuid, 'game/ark' );
		skillGroup = Math.floor( skillGroup/10 );
		
		var elSkillGroupImg = elTile.FindChildTraverse( 'JsFriendAdvertiseSkillGroup' );

		var szSkillGroupType = "skillgroup";
		if ( gameMode === 'scrimcomp2v2' )
		{
			szSkillGroupType = 'wingman';
		}
		else if ( gameMode === 'survival' )
		{
			szSkillGroupType = 'dangerzone';
		}
		
		if( !skillGroup )
			elSkillGroupImg.AddClass( 'hidden' );
		else
		{
			elSkillGroupImg.RemoveClass( 'hidden' );
			elSkillGroupImg.SetImage( 'file://{images}/icons/skillgroups/' + szSkillGroupType + skillGroup +'.svg' );
		}
	};

	var _OpenContextMenu = function ( xuid )
	{
		                                                                                             
		$.DispatchEvent( 'SidebarContextMenuActive', true );
		
		var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'',
			'',
			'file://{resources}/layout/context_menus/context_menu_playercard.xml', 
			'xuid='+xuid+
			'&type=nearby',
			function () {
				$.DispatchEvent('SidebarContextMenuActive', false )
			}
		);
		contextMenuPanel.AddClass( "ContextMenu_NoArrow" ); 
	};

	var _ShowInviteButton = function( elTile)
	{
		var elInvited = elTile.FindChildTraverse( 'JsInviteAdvertisingPlayer' );
		elInvited.visible = !(_m_xuid === MyPersonaAPI.GetXuid());
	};

	var _SetInvitedFromCallback = function( elTile )
	{
		var isInvited = FriendsListAPI.IsFriendInvited( _m_xuid );
		_SetInvited( elTile, isInvited );
	};

	var _SetInvited = function( elTile, isInvited )
	{
		var elInvited = elTile.FindChildTraverse( 'JsFriendInvited' );

		if ( elInvited !== null )
			elInvited.SetHasClass( 'hidden', !isInvited );
	};

	var _OnInviteSetPanelEvent = function( elTile )
	{
		var onActivate = function( xuid )
		{
			StoreAPI.RecordUIEvent( "ActionInviteFriendFrom_nearby" );
			FriendsListAPI.ActionInviteFriend( xuid, '' );
			$.DispatchEvent( 'FriendInvitedFromContextMenu', xuid );
		};
		
		var btn = elTile.FindChildTraverse( 'JsInviteAdvertisingPlayer' );
		btn.SetPanelEvent( 'onactivate', onActivate.bind( undefined, _m_xuid ) );
	};

	return {
		Init: _Init,                       
	};

})();

	                                                        
	    
	   	                                                            
	   	                                                                                            
		
	   	                                                                          

	   	                                                                          
	   	                                                                      
	   	                                                                               
	     

	                                           
	    
	   	                                                                                       

	   	                              
	   		                                             

	   	                                 
	   	 
	   		                                                                                
	   		                                                                    
	
	   		                                                   
	   	 

	   	               
	   		               
		
	   	                                    
	   	                           

	   	                                           
	   	 
	   		          
	   		 
	   			                                                                             
	   			                                                   
	   		 
	   	 

	   	                                    
	     

	                                                                      
	    
	   	                                                                      

	   	                                                            
	   	                                                                             

	   	                                        
	   	                           
	   	                                                                     

	   	                                                      
	   	                                           
	   	 
	   		                                                            
	   		                               
	   		                                                 

	   		                 
	   		 
	   			                                                           
	   			                                                         
	   		 

	   		            
	   			                                                  

	   		                                                                
	   		                                                                 

	   		                            
	   			                     

	   		           
	   		 
	   			                     

	   			                                                
	   			 
	   				                          
	   				                                                      
	   			 
	   			    
	   			 
	   				                         
	   				                                                                                                       
					
	   				                                             
	   				 
	   					                                                                         
	   					                                                   
	   				 

	   				                                                                              
	   			 

	   			                                              
	   			 
	   				                                                
	   			 

	   			                                                                                            
	   			                                                    
	   				                               
	   			   

	   			                         

	   			                         
	   		 
	   		    
	   		 
	   			                        
	   			                        

	   			                          

	   			                                                                                                                   
	   		 
	   	 
	     

	                                                         
	    
	   	                                                                      
	   	                                                                       

	   	                              
	   	 
	   		                             
	   		                            
	   	 

	   	                            
	   	 
	   		                                                             
	   		                            
	   	 
	   	    
	   	 
	   		                                                                             
	   		                                                                                

	   		                               
	   		 
				
	   			                                                    
	   			                                                                                
	   		 
	   		    
	   		 
	   			                                                    
	   			                                                                          
	   		 
			
	   		                                        
			
	   		                                                      
	   		                           
	   	 
	     

	                                                        
	    
	   	                              
	   	 
	   		                                                                             
	   		                                      
	   		                                                       
	   			                                                                       
	   			                                       
	   		    

	   		                                                        
	   			                                                                                                  
	   		    
	   		                                                        
	   			                               
	   		    
	   	 
	    

	                                         
	    
	   	                    
	   		              
			
	   		                                         
	   			                                                      
	   		    
	   			                                                 

	   		                                
	   	  
	     
