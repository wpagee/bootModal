Boot Modal
==========

Boot Modal has evoloved from a project I'm working on were we needed our dialogs to handle a number of functions
not currently available with bootstrap modals. 

1. Dynamic Creation of Modals
2. DOM injection and removel of modal objects
3. The ability to have multipule modals open (Automatic handling of focusing the most recent dialog)
4. The ablitity to associate a knockout viewModel with a dialog
5. If knockout is not included we create a simple result object of all the dialogs inputs. 

This project continues to evolve as I attempt to add additional features and improve upon my existing code.

<h2>Dependencies</h2>

<a href="http://getbootstrap.com/" title="Get Bootstrap">Twitter Bootstrap</a><br />
<a href="http://jquery.com/" title="jQuery">jQuery</a><br />
<a href="http://knockoutjs.com/" title="Knockout.js">Knockout</a> [optional]<br />


<h2>Examples</h2>

By default modals have a ok and cancel button. Once the buttons are triggered a callback will be fired once the modal has closed with two arguments a success {boolean} and results {object}. You can override the buttons with object in one of tow ways.<br />

<pre>
buttons: {
    'Accept Button': {
      class: 'btn btn-primary',
      callback: function(evt, results) {
        //handle ok event
      }
    },
    Cancel: {
      callback: function(evt, results) {
        // handle cancel event
      }
    }
  }
</pre>

<pre>
  var dlg = new BootModal({
    title: 'Delete Item',
    content: 'Are you sure you want to delete this item?'
    buttons: {
      Ok: {
        class: 'btn btn-primary',
        callback: function(evt, results) {
          //handle ok event
        }
      },
      Cancel: {
        class: 'btn btn-default',
        callback: function(evt, results) {
          // handle cancel event
        }
      }
    }
  });
  
  or
  
  BootModal.Confirm({
    title: 'Delete Item',
    content: 'Are you sure you want to delete this item?'
  }, function(success, results) {
    //handle close callback
  });
</pre>


<h2>Future Updates</h2>

Knockout validation<br />
The ablility to use knockout stringTempletes<br />
Angular Plugin
