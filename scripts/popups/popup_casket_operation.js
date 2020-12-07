"use strict";

var m_strOperation = '';
var m_CasketOperationTimeoutScheduledHandle = null;
var m_strShowSelectItemForCapabilityPopupCapability = '';
var m_numSubjectItems = 1;
var m_itemidCasket = '';
var m_itemidSubject = '';
var m_arrSubjectItemsRemaining = [];

var _BIsBatchMode = function()
{
	if ( m_strShowSelectItemForCapabilityPopupCapability && ( m_strShowSelectItemForCapabilityPopupCapability === 'batch' ) )
		return true;
	else
		return false;
};

var SetupPopup = function()
{
	m_strOperation = $.GetContextPanel().GetAttributeString( "op", "" );
	$.GetContextPanel().SetDialogVariable( "title", $.Localize( "#popup_casket_title_" + m_strOperation ) );

	m_itemidCasket = $.GetContextPanel().GetAttributeString( "casket_item_id", "" );

	m_strShowSelectItemForCapabilityPopupCapability = $.GetContextPanel().GetAttributeString( "nextcapability", "" );

	                 
	var itemidsList = $.GetContextPanel().GetAttributeString( "subject_item_id", "" );
	ConfigurePopupFromItemsList( itemidsList );

	                                                                                                     
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomizationNotification );
};

var ConfigurePopupFromItemsList = function( itemidsList )
{
	m_arrSubjectItemsRemaining = itemidsList.split( "," );
	
	m_numSubjectItems = m_arrSubjectItemsRemaining.length;
	$.GetContextPanel().SetDialogVariableInt( "count", m_numSubjectItems );
	$( '#ItemsRemaining' ).visible = ( m_numSubjectItems > 1 );
	$( '#PopupButtonRow' ).visible = _BIsBatchMode() && ( m_numSubjectItems > 1 );

	var itemid = m_arrSubjectItemsRemaining.splice( 0, 1 )[0];
	m_itemidSubject = itemid;

	if ( !InventoryAPI.GetItemRarityColor( m_itemidSubject ) ) {
		                                                     
		PanelTimedOut();
		return;
	}

	var elItem = $( "#CasketItemPanel" );
	elItem.SetAttributeString( 'itemid', itemid );
	elItem.BLoadLayoutSnippet( "LootListItem" );

	                                 
	elItem.FindChildInLayoutFile( 'ItemImage' ).itemid = itemid;
	elItem.FindChildInLayoutFile( 'JsRarity' ).style.backgroundColor = ItemInfo.GetRarityColor( itemid );
	ItemInfo.GetFormattedName( itemid ).SetOnLabel( elItem.FindChildInLayoutFile( 'JsItemName' ) );

                             
    var spinnerVisible = $.GetContextPanel().GetAttributeInt( "spinner", 0 );
    $( "#Spinner" ).SetHasClass( "SpinnerVisible", spinnerVisible );
    
	m_CasketOperationTimeoutScheduledHandle = $.Schedule( 10, PanelTimedOut );
	var schOperation = 0.75;
	if ( m_strOperation === 'loadcontents' ) {
		schOperation = 0.5;
	} else if ( ( m_strOperation === 'add' ) && m_strShowSelectItemForCapabilityPopupCapability ) {
		schOperation = 0.25;
	} else if ( _BIsBatchMode() ) {
		schOperation = 0.2;
	}
	          
	                                                                           
	              	                                                          
	 
		                                
		                  
			                       
	 
	          
	$.Schedule( schOperation, LaunchOperation );
};

var PanelTimedOut = function()
{
                                                     
    m_CasketOperationTimeoutScheduledHandle = null;
    $.DispatchEvent( 'UIPopupButtonClicked', '' );

    UiToolkitAPI.ShowGenericPopupOk(
        $.Localize( '#SFUI_SteamConnectionErrorTitle' ),
        $.Localize( '#SFUI_Steam_Error_LinkUnexpected' ),
        '',
        function()
        {
        },
        function()
        {
        }
    );
};

var _CancelCasketOperationTimeoutScheduledHandle  = function()
{
    if ( m_CasketOperationTimeoutScheduledHandle )
    {
        $.CancelScheduled( m_CasketOperationTimeoutScheduledHandle );
        m_CasketOperationTimeoutScheduledHandle = null;
    }
};

var _ClosePopUp = function()
{
    $.DispatchEvent( 'UIPopupButtonClicked', '' );
};

var _TeardownPreviousInventoryCapabilitiesPopup = function()
{
	$.DispatchEvent( 'ContextMenuEvent', '' );
	$.DispatchEvent( 'HideSelectItemForCapabilityPopup' );
	$.DispatchEvent( 'UIPopupButtonClicked', '' );
	$.DispatchEvent( 'CapabilityPopupIsOpen', false );
};

function OnRequestCancelBatch()
{
	                                                                                                                                         
	m_arrSubjectItemsRemaining = [];
}

function OnItemCustomizationNotification ( numericType, type, itemid )
{
	_CancelCasketOperationTimeoutScheduledHandle();

	  
	                        
	  
	switch ( type )
	{
	case 'casket_added':
	case 'casket_removed':
		if ( _BIsBatchMode() ) {
			if ( m_arrSubjectItemsRemaining.length > 0 ) {                               
				var strItemIDs = m_arrSubjectItemsRemaining.join( "," );
				ConfigurePopupFromItemsList( strItemIDs );
			} else {                                  
				_ClosePopUp();
			}
			return;
		}
	}

	  
	                         
	  
	_ClosePopUp();

	switch ( type )
	{
	case 'casket_too_full':
	case 'casket_inv_full':
		UiToolkitAPI.ShowGenericPopupOk(
			$.Localize( '#popup_casket_title_error_' + type ),
			$.Localize( '#popup_casket_message_error_' + type ),
			'',
			function()
			{
			},
			function()
			{
			}
		);
		break;
	case 'casket_added':
		                        
		if ( m_strShowSelectItemForCapabilityPopupCapability ) {                                    
			_TeardownPreviousInventoryCapabilitiesPopup();
			$.DispatchEvent( "ShowSelectItemForCapabilityPopup", m_strShowSelectItemForCapabilityPopupCapability, itemid, '' );
		}
		else  {                                                            
			$.DispatchEvent( "PromptShowSelectItemForCapabilityPopup",
				'#popup_casket_title_prompt_bulkstore', '#popup_casket_message_prompt_bulkstore',
				'casketstore', itemid, '' );
		}
		break;
	case 'casket_removed':
		                                                                                       
		_TeardownPreviousInventoryCapabilitiesPopup();
		if ( InventoryAPI.GetItemAttributeValue( itemid, 'items count' ) ) {
			$.DispatchEvent( "ShowSelectItemForCapabilityPopup", m_strShowSelectItemForCapabilityPopupCapability, itemid, '' );
		}
		break;
	case 'casket_contents':
		                              
		$.DispatchEvent( "ShowSelectItemForCapabilityPopup", m_strShowSelectItemForCapabilityPopupCapability, itemid, '' );
		break;
	default:
		             
		                                                                                                 
		break;
	}
};

                                 
    
   	                                               
   	              
     

function LaunchOperation()
{
	                                                                                                                   

	var nOpRequestNumber = 0;
	switch ( m_strOperation )
	{
		case "add": nOpRequestNumber = 1; break;
		case "remove": nOpRequestNumber = -1; break;
	}
	InventoryAPI.PerformItemCasketTransaction( nOpRequestNumber, m_itemidCasket, m_itemidSubject );
}

