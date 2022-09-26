var HashMap = require('hashmap');

class FunctionalComponent 
{
    constructor(name, transitions, choicePoints) 
    {
        this.name                     = name;
        this.globalStateMachineTable  = {};
        this.globaltransitions        = transitions;
        this.globalChoicePointsTable  = {};
        this.globalChoicePoints       = choicePoints;
        this.sensorCurrentState       = new HashMap();
        this.blePoweredOn             = false;

        if( transitions != undefined && transitions.length > 0)
        {
            this.globalStateMachineTable = processStateTransitionsTable(transitions);
            this.globalCurrentState = transitions[0].stateName;
        }

        if (choicePoints != undefined && choicePoints.length > 0)
        {
            this.globalChoicePointsTable = processChoicePointsTable(choicePoints);
        }
    }
    
    globalEventHandler( eventName, parameters )
    {

        if ( eventName == 'blePoweredOn'
            || eventName  == 'startScanning' )
        {
            this.sensorCurrentState.clear();
        }
        
        // console.log( "global state: " + this.globalCurrentState + ", event: " + eventName );

        var entryString = this.globalCurrentState + '-' + eventName;
        var transition  = this.globalStateMachineTable[entryString];
        if( transition == undefined )
        {
            console.log
            ( 
                "ERROR: component '" + this.name + "' " +
                "received unexpected event '" + eventName + "' " +
                "in state '" + this.globalCurrentState + "'"
            );
            return;
        }

        if( transition.transFunc == undefined)
        {
            console.log
            (
                "ERROR: component '" + this.name + "' " +
                "has undefined transition function for event '" + eventName + "' " +
                "in state '" + this.globalCurrentState + "'"
            );
            return;
        }

        transition.transFunc( this, parameters );

        var previousState = this.globalCurrentState;
        this.globalCurrentState = transition.nextState;

        if( this.globalCurrentState.charAt(this.globalCurrentState.length-1) != '?' ) return;

        var choicePoint = this.globalChoicePointsTable[ this.globalCurrentState ];
        if ( choicePoint == undefined )
        {
            console.log
            (
                "ERROR: component '" + this.name + "'  " +
                "unknown choice-point '" + this.globalCurrentState + "'"
            );
            this.globalCurrentState = previousState;
            return;
        }

        if( choicePoint(this) )
        {
            this.globalEventHandler('yes')
        }
        else
        {
            this.globalEventHandler('no' );
        }
    }

    eventHandler( eventName, parameters )
    {
        // console.log( "\n======= eventName: " + eventName + " ======= " );

        if ( isInSyncingProgress )
        {
            console.log( "======= isInSyncingProgress: " + isInSyncingProgress );
            return;
        }

        if ( (!isInSyncingProgress && this.globalCurrentState == 'Syncing') )
        {
            this.globalCurrentState = 'Idle';
        }

        if ( eventName == 'blePoweredOn' )
        {
            this.blePoweredOn = true;

            console.log( "blePoweredOn: " + this.blePoweredOn );

            this.globalEventHandler( eventName, parameters )
            return;
        }
        else 
        if ( eventName  == 'startScanning' 
            || eventName == 'bleScanningStarted'
            || eventName == 'bleSensorDiscovered'
            || eventName == 'stopScanning'
            || eventName == 'bleScanningStopped'
            || eventName == 'startRecording'
            || eventName == 'fsOpen'
            || eventName == 'stopRecording'
            || eventName == 'fsClose'
            || eventName == 'enableSync'
            || eventName == 'bleSensorData'
            || eventName == 'resetHeading'
            || eventName == 'revertHeading'
            || eventName == 'startSyncing' )
            {

            if ( eventName == 'startRecording' )
            {
                this.globalCurrentState = 'Measuring';
            }
            else
            if ( eventName == 'fsOpen' )
            {
                this.globalCurrentState = 'Measuring';
            }
            else
            if ( eventName == 'stopRecording' )
            {
                this.globalCurrentState = 'Recording';
            }

            // TODO improvement
            this.globalEventHandler( eventName, parameters );
            return;
        }

        if ( parameters == undefined ) 
        {
            return;
        }

        var addresses = parameters.addresses;

        if ( addresses == undefined ) 
        {
            return;
        }

        var sensorAddress = addresses[0];
        // console.log( "sensorAddress " + sensorAddress );

        var currentState = this.sensorCurrentState.get(sensorAddress);
        // console.log( "currentState " + currentState );

        if ( currentState == undefined || (!isInSyncingProgress && currentState == 'Syncing') )
        {
            currentState = 'Idle';
            this.sensorCurrentState.set(sensorAddress, currentState);
        }
        // console.log( "after currentState: " + currentState + ", event: " + eventName );

        var entryString = currentState + '-' + eventName;
        var transition  = this.globalStateMachineTable[entryString];

        // console.log( "entryString: " + entryString + ", transition: " + transition );

        if( transition == undefined ) 
        {
            console.log
            ( 
                "ERROR: component '" + this.name + "' " +
                "received unexpected event '" + eventName + "' " +
                "in state '" + currentState + "'"
            );
            return;
        }

        if( transition.transFunc == undefined)
        {
            console.log
            (
                "ERROR: component '" + this.name + "' " +
                "has undefined transition function for event '" + eventName + "' " +
                "in state '" + currentState + "'"
            );
            return;
        }

        transition.transFunc( this, parameters );

        var previousState = currentState;
        currentState = transition.nextState;
        this.sensorCurrentState.set(sensorAddress, currentState);

        // console.log( "======= event end " + currentState + "=======\n" );

        if( currentState.charAt(currentState.length-1) != '?' ) return;

        var choicePoint = this.globalChoicePointsTable[ currentState ];
        if( choicePoint == undefined )
        {
            console.log
            (
                "ERROR: component '" + this.name + "'  " +
                "unknown choice-point '" + currentState + "'"
            );

            currentState = previousState;
            this.sensorCurrentState.set(sensorAddress, currentState);
            // console.log( "after choicePoint currentState " + currentState );

            return;
        }

        var sensor = [sensorAddress];

        if( choicePoint(this, {addresses:sensor}) )
        {
            this.eventHandler('yes', {addresses:sensor})
        }
        else
        {
            this.eventHandler('no', {addresses:sensor} );
        }
    }
}

// =======================================================================================
// Local functions
// =======================================================================================

// ---------------------------------------------------------------------------------------
// -- Process state transitions table --
// ---------------------------------------------------------------------------------------
function processStateTransitionsTable( stateTransitionsTable )
{
    var stateMachineTable = {};

    var entryString, transition;
    for( var i=0; i < stateTransitionsTable.length; i++ )
    {
        transition = stateTransitionsTable[i];

        entryString = transition.stateName + '-' + transition.eventName;
        if( stateMachineTable[ entryString ] != undefined )
        {
            console.log( "ERROR: transition for event '" + transition.eventName  + "' " +
                         "in state '" + transition.stateName + "' " + 
                         "already defined!" );
            continue;
        }
        stateMachineTable[ entryString ] = transition;
    };

    return stateMachineTable;
}

// ---------------------------------------------------------------------------------------
// -- Process choice-points table --
// ---------------------------------------------------------------------------------------
function processChoicePointsTable( choicePointsTable )
{
    var choicePoints = {};
    choicePointsTable.forEach( function(choicePoint)
    {
        choicePoints[choicePoint.name] = choicePoint.evalFunc;
    });
    return choicePoints;
}

// =======================================================================================
// Export the FunctionalComponent class
// =======================================================================================
module.exports = FunctionalComponent;