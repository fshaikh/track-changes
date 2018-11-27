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

### Track when target properties (including nested) are modified
```js
const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                console.log(opType);  // OpType.Set
                console.log(propertyKey) // 'name'('type' when type nested property is set)
                console.log(newValue) // 'Furqan - modified' ('geo' when type nested property is set)
            };
            const proxy = trackChanges(target, trackerFn);
            // Setting a property will invoke the tracker function
            proxy.name = 'Furqan - modified';
            // Setting a nested property will also invoke the tracker function
            proxy.address.geo.encoding.type = 'geo';
```

### Track when nested array properties are modified
```js
const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                console.log(opType);  // OpType.Set
                console.log(propertyKey) // 'professional'
                console.log(newValue) // [
                                            // {name: 'Amazon',title: 'Software Engineer'},
                                            // {name: 'Microsoft',title: 'Technical Lead'},
                console.log(oldValue) // [
                                            // {name: 'Amazon',title: 'Software Engineer'},
                                            // {name: 'Microsoft',title: 'Technical Lead'},
                                            //{ 'name': 'Google', 'title': 'Design Lead' } ]
            };
const proxy = trackChanges(target, trackerFn);
// Setting a nested array property will invoke the tracker function
proxy.companies.professional.push({ 'name': 'Google', 'title': 'Design Lead' });
```

### Track when array value is get/set using index
```js
let hobbies = ['tennis'];
            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Get);
                expect(propertyKey).toEqual('0'); 
                expect(value).toEqual('tennis');
            };
            const proxy = trackChanges(hobbies, trackerFn);
            // Accessing an array item using index will invoke the tracker function
            proxy[0];


            // Setting an array item will invoke the tracker function
            const trackerFn2 = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('1'); 
                expect(value).toEqual('reading');
            };
            const proxy2 = trackChanges(hobbies, trackerFn2);
            proxy2[1] = 'reading';
```

### Track when setting array value using push
```js
let hobbies = ['tennis'];
            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Get);
                expect(propertyKey).toEqual('push');
                expect(value).toEqual(['tennis', 'reading']);
            };
            const proxy = trackChanges(hobbies, trackerFn);
            // Setting an array item using push will invoke the tracker function
            proxy.push('reading');
```

### Track deleting property on target
```js
            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Delete);
                expect(propertyKey).toEqual('type');
            };
            const proxy = trackChanges(target, trackerFn);
            delete proxy.address.geo.encoding.type;
```

### Track when calling Object.assign on targets
```js
            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('phone');
                expect(newValue).toEqual('1234');
            };
            const proxy = trackChanges(target, trackerFn);
            Object.assign(proxy, { 'phone': '1234' })
```

### Track when setting a nested object on an array target
```js
let array = [1, 2, { a: 3 }];
const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(newValue).toEqual(4);
};
const proxy = trackChanges(array, trackerFn);
proxy[2].a = 4;
```

### Track when calling sort on array target
```js
let array = [4,2,1,6,7];
const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Sort);
                expect(newValue).toEqual([1,2,4,6,7]);
};
const proxy = trackChanges(array, trackerFn);
proxy.sort();
```

### Allow only access to known object properties
```js
const obj = {foo: true};
const proxy = trackChanges(obj, trackerFn);
// Throws a TypeError when you try to access an unknown property
console.log(proxy.bar);
//=> [TypeError] Unknown property: bar
```

