              
   
                                                            
'use strict';

var ItemTile = ( function()
{
	var _OnTileUpdated = function()
	{
		var id = $.GetContextPanel().GetAttributeString( 'itemid', '0' );

		if ( id === '0' )
			return;

		var idForDisplay = id;
		if ( $.GetContextPanel().GetAttributeString( 'filter_category', '' ) === 'inv_graphic_art' )
		{
			idForDisplay = ItemInfo.GetFauxReplacementItemID( id, 'graffiti' );
		}

		_SetItemName( idForDisplay );
		_SetItemRarity( id );
		_SetEquippedState( id );
		_SetStickers( id );
		_SetRecentLabel( id );
		_TintSprayImage( id );
		_DisableTile( id );
		_SetBackground( id );
		_SetMultiSelect( id );

		                                                               
		                                                       
		var loadImage = $.GetContextPanel().GetAttributeString( 'loadimage', '' );

		if ( loadImage )
		{
			_SetImage( id );
		}

		                                                 
	};

	                                                                                                    
	                                                                       
	                                                                                                    
	var _SetItemName = function( id )
	{
	    var fmtName = ItemInfo.GetFormattedName( id );
	    fmtName.SetOnLabel( $( '#JsItemName' ) );
	};

	function _SetBackground ( id )
	{
		var elTeamTile = $.GetContextPanel().FindChildInLayoutFile( 'ItemTileTeam' );

		var subSlot = ItemInfo.GetSlotSubPosition( id );
		if ( subSlot == 'customplayer' )
		{
			elTeamTile.visible = true;

			var isCT = ItemInfo.IsItemCt( id );

			if ( isCT )
			{
				elTeamTile.SetImage( "file://{images}/icons/ui/ct_logo_1c.svg" );
				elTeamTile.style.washColor = '#B5D4EE';

			}
			else
			{
				elTeamTile.SetImage( "file://{images}/icons/ui/t_logo_1c.svg" );
				elTeamTile.style.washColor = '#EAD18A';
			}
		}
		else
		{
			elTeamTile.visible = false;
		}
	}

	var _SetMultiSelect = function( id )
	{
		var bSelectedInMultiSelect = ( $.GetContextPanel().GetParent() &&
			$.GetContextPanel().GetParent().GetAttributeInt( "capability_multistatus_selected", 0 ) &&
			InventoryPanel.GetCapabilityInfo().multiselectItemIds &&
			InventoryPanel.GetCapabilityInfo().multiselectItemIds.hasOwnProperty( id ) );
		
		$.GetContextPanel().SetHasClass( 'capability_multistatus_selected', bSelectedInMultiSelect );
	};

	                             
	    
	   	                                                                   
	     

	var _SetImage = function( id )
	{
		$.GetContextPanel().FindChildInLayoutFile( 'ItemImage' ).itemid = id;
	};

	var _SetItemRarity = function( id )
	{
		var color = ItemInfo.GetRarityColor( id );

		if ( !color )
			return;
		
		$.GetContextPanel().FindChildInLayoutFile( 'JsRarity' ).style.backgroundColor = color;
	};

	var _SetEquippedState = function( id )
	{
		var subSlot = ItemInfo.GetSlotSubPosition( id );
		var elCtDot = $.GetContextPanel().FindChildInLayoutFile( 'ItemEquipped-ct' );
		var elTDot = $.GetContextPanel().FindChildInLayoutFile( 'ItemEquipped-t' );
		elTDot.AddClass( 'hidden' );
		elCtDot.AddClass( 'hidden' );
		elTDot.RemoveClass( 'item-tile__equipped__radiodot--filled' );
		elCtDot.RemoveClass( 'item-tile__equipped__radiodot--filled' );

		for ( var team of [ 't', 'ct', 'noteam' ] )
		{
			if ( !ItemInfo.IsShuffleEnabled( id, team ) || subSlot === "flair0" || subSlot === "spray0")
			{
				if ( ItemInfo.IsEquipped( id, team ) )
				{
					_SetEquipIcon( false, team );
				}				
			}
			else if ( ItemInfo.IsShuffleEnabled( id, team ) && ItemInfo.IsItemInShuffleForTeam( id, team ) )
			{
				_SetEquipIcon( true, team );
			}
		}	
	};

	var _SetEquipIcon = function( isShuffle, team )
	{
		if ( team === 'noteam' )
			team = 'ct';                                            

		var elCtDot = $.GetContextPanel().FindChildInLayoutFile( 'ItemEquipped-' + team );
		
		elCtDot.RemoveClass( 'hidden' );
		elCtDot.AddClass( 'item-tile__equipped__radiodot--filled' );
		elCtDot.SetHasClass( 'shuffle', isShuffle );
	};

	var _SetStickers = function( id )
	{
		var listStickers = ItemInfo.GetitemStickerList( id );
		var elParent = $.GetContextPanel().FindChildInLayoutFile( 'StickersOnWeapon' );
		elParent.RemoveAndDeleteChildren();

		if ( listStickers.length > 0 )
		{
			listStickers.forEach( function( entry )
			{
				                                  
				$.CreatePanel( 'Image', elParent, 'ItemImage' + entry.image, {
					src: 'file://{images_econ}' + entry.image + '.png',
					scaling: 'stretch-to-fit-preserve-aspect',
					class: 'item-tile__stickers__image'
				} );
			} );
		}
	};

	var _SetRecentLabel = function( id )
	{
		var isRecentValue = InventoryAPI.GetItemSessionPropertyValue( id, 'recent' );
		var isUpdatedValue = InventoryAPI.GetItemSessionPropertyValue( id, 'updated' );
		var elPanel = $.GetContextPanel().FindChildInLayoutFile( 'JsRecent' );

		if ( isUpdatedValue === '1' || isRecentValue === '1' )
		{
			var locString = '#inv_session_prop_recent';
			if ( isRecentValue === '1' )
			{	                               
				                                                                                                     
				                                                                                                                                             
				var strItemPickupMethod = InventoryAPI.GetItemSessionPropertyValue( id, 'item_pickup_method' );
				if ( strItemPickupMethod === 'quest_reward' )
				{
					locString = '#inv_session_prop_quest_reward';
				}
			}
			else
			{	                                                 
				locString = '#inv_session_prop_updated';
			}
			
			elPanel.RemoveClass( 'hidden' );
			elPanel.text = $.Localize( locString );
			return;
		}

		elPanel.AddClass( 'hidden' );
	};

	var _TintSprayImage = function( id )
	{
		var elImage = $.GetContextPanel().FindChildInLayoutFile( 'ItemImage' );
		TintSprayIcon.CheckIsSprayAndTint( id, elImage );
	};

	var _DisableTile = function( id )
	{
		var capabilityInfo = _GetPopUpCapability();

		if ( capabilityInfo &&
			capabilityInfo.capability === 'can_sticker' &&
			!ItemInfo.ItemMatchDefName( id, 'sticker' ) )
		{
			$.GetContextPanel().enabled = ( ItemInfo.GetStickerSlotCount( id ) > ItemInfo.GetStickerCount( id ) );
		}
		else if ( capabilityInfo &&
			capabilityInfo.capability === 'can_patch' &&
			!ItemInfo.ItemMatchDefName( id, 'patch' ) )
		{
			$.GetContextPanel().enabled = ( ItemInfo.GetStickerSlotCount( id ) > ItemInfo.GetStickerCount( id ) );
		}
	};

	var _OnActivate = function()
	{
		var id = $.GetContextPanel().GetAttributeString( 'itemid', '0' );
		                                       

		                                                
		var capabilityInfo = _GetPopUpCapability();
		if ( capabilityInfo )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'inventory_item_select', 'MOUSE' );
				                                 
			InventoryAPI.PrecacheCustomMaterials( id );

			if ( capabilityInfo.capability === 'nameable' )
			{
				_CapabilityNameableAction( SortIdsIntoToolAndItemID( id, capabilityInfo.initialItemId ) );
			}
			else if ( capabilityInfo.capability === 'can_sticker' )
			{
				_CapabilityCanStickerAction( SortIdsIntoToolAndItemID( id, capabilityInfo.initialItemId ) );
			}
			else if ( capabilityInfo.capability === 'can_patch' )
			{
				_CapabilityCanPatchAction( SortIdsIntoToolAndItemID( id, capabilityInfo.initialItemId ) );
			}
			else if ( capabilityInfo.capability === 'decodable' )
			{
				_CapabilityDecodableAction( SortIdsIntoToolAndItemID( id, capabilityInfo.initialItemId ) );
			}
			else if ( capabilityInfo.capability === 'can_stattrack_swap' )
			{
				_CapabilityStatTrakSwapAction( capabilityInfo, id );
			}
			else if ( capabilityInfo.capability === 'can_collect' )
			{
				_CapabilityPutIntoCasketAction( id, capabilityInfo.initialItemId );
			}
			else if ( capabilityInfo.capability === 'casketcontents' )
			{
				_CapabilityItemInsideCasketAction( capabilityInfo.initialItemId, id );
			}
			else if ( capabilityInfo.capability === 'casketretrieve' )
			{
				$.GetContextPanel().ToggleClass( 'capability_multistatus_selected' );
				$.DispatchEvent( 'UpdateSelectItemForCapabilityPopup', capabilityInfo.capability, id,
					$.GetContextPanel().BHasClass( 'capability_multistatus_selected' )
					);
				                                                                               
			}
			else if ( capabilityInfo.capability === 'casketstore' )
			{
				$.GetContextPanel().ToggleClass( 'capability_multistatus_selected' );
				$.DispatchEvent( 'UpdateSelectItemForCapabilityPopup', capabilityInfo.capability, id,
					$.GetContextPanel().BHasClass( 'capability_multistatus_selected' )
					);
				                                                                                                 
			}

			return;
		}

		                        
		var filterValue = $.GetContextPanel().GetAttributeString( 'context_menu_filter', null );
		var filterForContextMenuEntries = filterValue ? '&populatefiltertext=' + filterValue : '';
		                                    
		var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'',
			'',
			'file://{resources}/layout/context_menus/context_menu_inventory_item.xml',
			'itemid=' + id + filterForContextMenuEntries,
			function()
			{
			}
		);
		contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
	};

	var _GetPopUpCapability = function()
	{
		if ( typeof InventoryPanel === "object" )                                                                 
		{
			var capInfo = InventoryPanel.GetCapabilityInfo();
			if ( capInfo.popupVisible )	
			{
				return capInfo;
			}
		}

		return null;
	};

	var SortIdsIntoToolAndItemID = function( id, initalId )
	{
		var toolId = InventoryAPI.IsTool( id ) ? id : initalId;
		var itemID = InventoryAPI.IsTool( id ) ? initalId : id;

		                                                 
		                                                      

		return {
			tool: toolId,
			item: itemID
		};
	};

	var _CapabilityNameableAction = function( idsToUse )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_nameable.xml',
			'nametag-and-itemtoname=' + idsToUse.tool + ',' + idsToUse.item +
			'&' + 'asyncworktype=nameable'
		);
	};

	var _CapabilityCanStickerAction = function( idsToUse )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_can_sticker.xml',
			'sticker-and-itemtosticker=' + idsToUse.tool + ',' + idsToUse.item +
			'&' + 'asyncworktype=can_sticker'
		);
	};

	var _CapabilityCanPatchAction = function( idsToUse )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_can_sticker.xml',
			'sticker-and-itemtosticker=' + idsToUse.tool + ',' + idsToUse.item +
			'&' + 'asyncworktype=can_patch'
		);
	};

	var _CapabilityDecodableAction = function( idsToUse )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_decodable.xml',
			'key-and-case=' + idsToUse.tool + ',' + idsToUse.item +
			'&' + 'asyncworktype=decodeable'
		);
	};

	var _CapabilityPutIntoCasketAction = function( idCasket, idItem, cap )
	{
		                                                                                           

		$.DispatchEvent( 'ContextMenuEvent', '' );
		if ( !cap ) {
			$.DispatchEvent( 'HideSelectItemForCapabilityPopup' );
			$.DispatchEvent( 'UIPopupButtonClicked', '' );
			$.DispatchEvent( 'CapabilityPopupIsOpen', false );
		}

		if ( InventoryAPI.GetItemAttributeValue( idCasket, 'modification date' ) )
		{
			               
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'', 
				'file://{resources}/layout/popups/popup_casket_operation.xml',
				'op=add' +
				( cap ? '&nextcapability=' + cap : '' ) +
				'&spinner=1' +
				'&casket_item_id=' + idCasket +
				'&subject_item_id=' + idItem
			);
		}
		else
		{
			                                                                                                    
			var fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( 1200, 0 );              
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'', 
				'file://{resources}/layout/popups/popup_capability_nameable.xml',
				'nametag-and-itemtoname=' + fauxNameTag + ',' + idCasket +
				'&' + 'asyncworktype=nameable' +
				'&' + 'asyncworkitemwarningtext=#popup_newcasket_warning'
			);
		}
	};

	var _CapabilityItemInsideCasketAction = function( idCasket, idItem )
	{
		                                                              

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + idItem +
			'&' + 'inspectonly=true' +
			'&' + 'insidecasketid=' + idCasket +
			'&' + 'showequip=false' +
			'&' + 'allowsave=false',
			'none'
		);
	}

	var _CapabilityItemRetrieveFromCasketAction = function( idCasket, idItem )
	{
		                                                                

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'', 
			'file://{resources}/layout/popups/popup_casket_operation.xml',
			'op=remove' +
			'&nextcapability=casketretrieve' +
			'&spinner=1' +
			'&casket_item_id=' + idCasket +
			'&subject_item_id=' + idItem
		);
	}

	var _CapabilityStatTrakSwapAction = function( capInfo, id )
	{
		                                                  
		                                                                                          
		                                                                                                    
		if ( InventoryAPI.IsTool( capInfo.initialItemId ) )
		{
			$.DispatchEvent( "ShowSelectItemForCapabilityPopup", 'can_stattrack_swap', id, capInfo.initialItemId );
		}
		else
		{
			                               
			                                           
			                                          
			                        
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/popups/popup_capability_can_stattrack_swap.xml',
				'swaptool=' + capInfo.secondaryItemId +
				'&' + 'swapitem1=' + capInfo.initialItemId +
				'&' + 'swapitem2=' + id
			);
		}
	};

	var _Ondblclick = function()
	{
		                     
		var id = $.GetContextPanel().GetAttributeString( 'itemid', '0' );
		                                       

		if ( ItemInfo.GetSlotSubPosition( id ) || ItemInfo.ItemMatchDefName( id, 'sticker' ) )
		{
			$.DispatchEvent( "InventoryItemPreview", id );
			$.DispatchEvent( 'ContextMenuEvent', '' );
		}
	}

	var _ShowTooltip = function()
	{
		var id = $.GetContextPanel().GetAttributeString( 'itemid', '0' );

		if ( !InventoryAPI.IsItemInfoValid( id ) )
		{
			return;
		}

		UiToolkitAPI.ShowCustomLayoutParametersTooltip(
			'ItemImage',
			'JsItemTooltip',
			'file://{resources}/layout/tooltips/tooltip_inventory_item.xml',
			'itemid=' + id
		);
	};

	var _HideTooltip = function()
	{
		UiToolkitAPI.HideCustomLayoutTooltip( 'JsItemTooltip' );
	};

	return {
		OnTileUpdated	: _OnTileUpdated,
		OnActivate		: _OnActivate,
		ShowTooltip		: _ShowTooltip,
		HideTooltip		: _HideTooltip,
		Ondblclick		: _Ondblclick
	};
} )();


                                                                                                    
                                           
                                                                                                    
( function()
{
	$.RegisterEventHandler( 'CSGOInventoryItemLoaded', $.GetContextPanel(), ItemTile.OnTileUpdated );
	$.RegisterEventHandler( 'UpdateItemTile', $.GetContextPanel(), ItemTile.OnTileUpdated );
} )();






                                       
                                                                                                         

                                      
    
   	                             

   	             
   	    
   	   	                                          
   	   	                                                                                 
   	   	                                                                                                                                        
   	   	       
   	    

   	                                                
    

                            
    
   	                                                                                 
   	                                                
    

                         
    
   	                                                               
    

                                
    
   	                               

   	                                               
   		            
   		                 
   		                                                                
   		                        
   	  
    

                         
    
   	                                                        

   	                                     
   	   
   		                                            
   		                               
   	   
    




                                                                                                    
                                    
                                                                                                    
                                
   	                                                             
    

                                         
   	                                        
    

                                 
    
   	                                                                                 
   	 
   		                         
   		                                                    
   		                                                                    
   		                                                  
   		                                                   
   		                                                   
		
   		                             
   			                                      
   		                     
   			                                        
   		    
   			                                   
   	 
	
   	             
    

           

   	             	                
     

                                                   
                                
                                 
    
   	                                 
   	 
   		                                                                
   	 
		
   	                                                                                                       
    

                                                                  
                                 
                          
    
   	                                 
   	 	
   		                                                                      
   		                        
   		                                           
   	 

   	                     
    

                                        
    
   	                     

   	                           	
   	                                              
   		                                              
	
   	                        
   	 
   		                                   

   		                        
   			             
   	 
		
   	                                      
    
