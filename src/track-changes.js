import Errors from './errors';
import OpType from './OpType';

/**
 * Function to watch an object for changes
 * @param {* object} watchedObj - Object to watch for changes
 * @param {* function} trackerFn - Function which will be invoked when change happens to the watched object
 */

const trackChanges = (watchedObj, trackerFn) => {
    // validate input prameters
    if (!isTargetValid(watchedObj)) {
        throw Errors.ARGUMENT_TYPE_TARGET_VALIDATION;
    }
    if (typeof trackerFn !== 'function') {
        throw Errors.ARGUMENT_TYPE_TRACKERFN_VALIDATION;
    }

    // create proxy for the watched object
    const proxy = new Proxy(watchedObj, getProxyHandler(trackerFn));

    return proxy;
};

const getProxyHandler = (trackerFn) => {
    let key = '';
    /**
  * Proxy Handler object which defines Traps and corresponding handler function
  *  */
    const proxyHandler = {
        /**
         * Defines get trap. Invoked when accessing the targetproperty via proxy
         */
        get: (target, propertyKey, context) => {
            const value = Reflect.get(target, propertyKey, context);
            if (typeof value === 'object' && value !== null) {
                return new Proxy(value, proxyHandler);
            }
            // Handle the case where client cam make changes to a array property using push. For eg:
            // obj.hobbies.push('gardening')
            // In this case proxy will be created for push function as we want to trap the push function
            if(typeof value === 'function') {
                if(propertyKey === 'push') {
                    return function() {
                        // copy the old value to send to the tracker function
                        let oldValue = [...target];
                        // call the function on the Array prototype using Reflect.apply
                        // NOTE: This is a much cleaner way tha using function.apply
                        const response = Reflect.apply(Array.prototype[propertyKey], target, arguments);
                        // Invoke the tracker function
                        Reflect.apply(trackerFn, context, [OpType.Set, propertyKey, target, oldValue])
                        return response;
                    }
                }
                if(propertyKey === 'sort') {
                    return function() {
                        // copy the old value to send to the tracker function
                        let oldValue = [...target];
                        let response = Reflect.apply(Array.prototype[propertyKey], target, arguments);
                        // Invoke the tracker function
                        Reflect.apply(trackerFn, context, [OpType.Sort, propertyKey, target, oldValue])
                        return response;
                    }
                }
            }
            // Invoke the tracker function
            Reflect.apply(trackerFn, target, [OpType.Get, propertyKey, value])
            return value;
        },
        /**
         * Defines set trap
         * @param {*} target - Target object to set property on
         * @param {*} propertyKey - Property Key
         * @param {*} propertyValue - Property Value
         * @param {*} context - this to pass
         */
        set: (target, propertyKey, propertyValue, context) => {
            // Invoke tracker function
            Reflect.apply(trackerFn, target, [OpType.Set, propertyKey, propertyValue, target[propertyKey]]);            
            return Reflect.set(target, propertyKey, propertyValue, context);
        },
        /**
          * Defines delete property trap
          * @param {*} target - Target object to set property on
          * @param {*} propertyKey - Property Key
          */
        deleteProperty: (target, propertyKey) => {
            // Invoke tracker function
            Reflect.apply(trackerFn, target, [OpType.Delete, propertyKey])  
            return Reflect.deleteProperty(target, propertyKey)
        }
    };
    return proxyHandler;
};

/**
 * Determines if the object to watch is of a valid type. It shoud be either : Object or Array
 * @param {any} watchedObj - Object to watch
 */
const isTargetValid = (watchedObj) => {
    return watchedObj.toString() === '[object Object]' ||
        toString.call(watchedObj) === '[object Array]'
}

export default trackChanges;