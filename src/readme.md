# track-changes

> Track an object or array for changes

Target object can have nested objects/arrays which will also be tracked
Uses the [`Proxy` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) and [`Reflect` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect).


## Install

```
$ npm install track-changes
```


## Usage

```js
// Import the 
import trackChanges from 'track-changes';
// Define the target object to track for changes.
// Target object can have nested objects/arrays which will also be tracked
let target = {
    name: 'furqan',
    age: 30,
    isSmart: false,
    address: {
        geo: {
            lat: 23.56,
            lon: 56.78,
            encoding: {
                type: 'map'
            }
        },
        city: 'bangalore',
        zipcode: '56004'
    },
    companies: {
        professional: [
            {
                name: 'Amazon',
                title: 'Software Engineer'
            },
            {
                name: 'Microsoft',
                title: 'Technical Lead'
            }
        ],
        freelancing: [
            {
                name: 'Reverse Current',
                title: 'Consultant'
            }
        ]
    },
    hobbies: ['tennis']
};

// Define the tracker function which will be invoked when the target object
// is accessed/modified
const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                console.log(opType); // Set | Get | Delete | Sort | Assign
                console.log(propertyKey); // Property name being accessed/modified/deleted
                console.log(newValue); // New value of the property. null for Delete
                console.log(oldValue); // Old value of the property. null for Get , Delete
            };
// Call the trackChanges function passing the target object and tracker function
// It will return a proxy object using which  we access/modify the target
let watchedObject = trackChanges(target, trackerFn);

// Set a property value. This will:
//   1. Set the value in target property
//   2. Invoke tracker function passing the parameters
watchedObject.name = 'Furqan - Modified';
// opType = 'Set' , propertyKey = 'name', newValue = 'Furqan -modified', oldValue = 'Furqan'

// Set a nested property value
watchedObject.address.geo.encoding.type = 'geo';
// opType = 'Set' , propertyKey = 'type', newValue = 'geo', oldValue = 'map'
```


## API

### trackChanges(target, trackerFn)

Returns a version of `target` that is tracked for changes. It's the exact same object, with some `Proxy` traps.

#### target

Type: `Object`

Object to watch for changes.

#### trackerFn

Type: `Function`
Function that is invoked when target changes/accessed

##### opType
Type: `String`
Operation being performed on the target. One of these values: 'Get', 'Set', 'Delete', 'Assign', 'Sort'
##### propertyKey
Type: `String`
Property name being changed/accessed
##### newValue
Type: `any`
New value of the property
##### oldValue
Type: `any`
Old value of the property

## Scenarios

### Track when target properties are accessed
```js
const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                console.log(opType);  // OpType.Get
                console.log(propertyKey) // 'name' | 'type'
                console.log(newValue) // 'furqan' | 'map'
            };
            const proxy = trackChanges(target, trackerFn);
            // Accessing a property will invoke the tracker function
            proxy.name;
            // Accessing a nested property will also invoke the tracker function
            proxy.address.geo.encoding.type;
```
## Use-case

I had some code that was like:

```js
const foo = {
	a: 0,
	b: 0
};

// …

foo.a = 3;
save(foo);

// …

foo.b = 7;
save(foo);


// …

foo.a = 10;
save(foo);
```

Now it can be simplified to:

```js
const foo = trackChanges({
	a: 0,
	b: 0
}, () => save(foo));

// …

foo.a = 3;

// …

foo.b = 7;

// …

foo.a = 10;
```


