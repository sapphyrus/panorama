

"use strict"; 

                                                                                                                                          
                                                                                                                  
  
         
                                                                          
                                                                
  
                                                                                   
   
                                               
                                
  

var Scheduler = ( function ()
{
	                                  
	var oJobs = {};

	function _Schedule ( delay, fn, key = 'default'  )
	{
		if ( !oJobs.hasOwnProperty( key ) )
			oJobs[ key ] = [];
		
		oJobs[ key ].push( _Job( delay, fn, key ) );
	}

	function _Cancel ( key = 'default' )
	{
		if ( oJobs.hasOwnProperty( key ) )
		{
			while ( oJobs[ key ].length )
			{
				var job = oJobs[ key ].pop();
				job.Cancel();
			}
		}
	}

	function _Job ( delay, func, key )
	{		
		var m_handle = $.Schedule( delay, function() 
		{
			m_handle = null;                                                                        
			func(); 
  			                                                  

		} );	

  		                                                 

		function _GetHandle ()
		{
			return m_handle;
		}

		function _Cancel()
		{
			if ( m_handle ) 
			{
  				                                                    
				$.CancelScheduled( m_handle );
				m_handle = null;
			}
		}

		return {
			Cancel: _Cancel,
			GetHandle: _GetHandle,
		} 	
	}

	return {
		
		Schedule: 	_Schedule,
		Cancel:		_Cancel
	 };
})();

                                                                                                    
                                           
                                                                                                    
(function()
{
})();
