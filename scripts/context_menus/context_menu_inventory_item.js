"use-strict";

var ItemContextMenu = ( function (){

	var _SetupContextMenu = function()
	{
		var id = $.GetContextPanel().GetAttributeString( "itemid", "(not found)" );
		var populateFilterText = $.GetContextPanel().GetAttributeString( "populatefiltertext", "(not found)" );

		                                        
		                                                    

		                                                                                                             
		InventoryAPI.PrecacheCustomMaterials( id );
		
		_PopulateContextMenu( id, populateFilterText );
	};

	var _PopulateContextMenu = function ( id, populateFilterText )
	{	
		var elParent = $.GetContextPanel();

		                                                                                                    
		                                                                        
		                                            
		                                                                                                    
		var validEntries = ItemContextEntires.FilterEntries( populateFilterText );

		var OnMouseOver = function( location, displayText )
		{
			UiToolkitAPI.ShowTextTooltip( location, displayText );
		};

		var hasEntries = false;
		var lastButtonAdded = null;
	
		for( var i = 0; i < validEntries.length; i++ )
		{
			var entry = validEntries[ i ];
		
			if ( entry.AvailableForItem( id ) ) 
			{
				var elButton = $.CreatePanel( 'Button', elParent, 'ContextMenuItem' + i );
				lastButtonAdded = elButton;

				var elLabel = $.CreatePanel( 'Label', elButton, '', { html: 'true' } );
				var displayName = ''
				
				if ( entry.name instanceof Function )
				{
					displayName = entry.name( id );
				}
				else
				{
					displayName = entry.name;
				}

				elLabel.text = '#inv_context_' + displayName;

				hasEntries = true;

				if( entry.style && populateFilterText === "(not found)" )
				{
					var strStyleToAdd = entry.style(id);
					elButton.AddClass( strStyleToAdd );
				}

				var handler = entry.OnSelected.bind(this, id);

				elButton.SetPanelEvent( 'onactivate', function( event_handler ) 
				{
					$.DispatchEvent( 'PlaySoundEffect', 'inventory_item_popupSelect', 'MOUSE' );

					event_handler();

				}.bind(this, handler));

				if( entry.CustomName )
				{
					if( entry.CustomName(id) !== '' )
					{
						var customName = entry.CustomName(id);

						elButton.SetPanelEvent( 'onmouseover', OnMouseOver.bind( undefined ,elButton.id, customName ));
						elButton.SetPanelEvent( 'onmouseout',function(){
							UiToolkitAPI.HideTextTooltip();
						});
					}
				}
			}
		}

		if ( lastButtonAdded )
		{	                                                  
			lastButtonAdded.RemoveClass( 'BottomSeparator' );
		}

		                                              
		if ( !hasEntries )
		{
			var elButton = $.CreatePanel( 'Button', elParent, 'ContextMenuItem' );
			var elLabel = $.CreatePanel( 'Label', elButton, '', {html: 'true'} );
			elLabel.text = '#inv_context_no_valid_actions';

			elButton.SetPanelEvent( 'onactivate', _ => $.DispatchEvent( 'ContextMenuEvent', '' ) );
		}
	};

	return {
		SetupContextMenu: _SetupContextMenu,
	};
})();
