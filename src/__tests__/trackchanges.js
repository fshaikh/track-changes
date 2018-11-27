import trackChanges from '../track-changes';
import errors from '../errors';
import OpType from '../OpType';

var target = {
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
var clonedTarget = '';

const getProxyWithoutWatcher = (objToWatch = target) => {
    return trackChanges(objToWatch, () => { });
}

const getMockedTrackerFn = (trackerFn) => {
    return jest.fn(trackerFn);
}

const isInvoked = (mock) => {
    return mock.mock.calls.length;
}

describe('track changes', () => {
    beforeAll(() => {
        clonedTarget = JSON.stringify(target);
    });
    beforeEach(() => {
        target = JSON.parse(clonedTarget);
    });
    describe('should validate input parameters', () => {
        it('should validate watchedObj', () => {
            let error;
            try {
                trackChanges('', '');
            } catch (e) {
                error = e;
            }
            expect(error).toBe(errors.ARGUMENT_TYPE_TARGET_VALIDATION);
        });
        it('should validate tackerFn', () => {
            let error;
            try {
                trackChanges({}, '');
            } catch (e) {
                error = e;
            }
            expect(error).toBe(errors.ARGUMENT_TYPE_TRACKERFN_VALIDATION);
        });
        it('should validate both parameters', () => {
            let error;
            trackChanges({}, () => { });
            expect(error).toBeUndefined();
        });
    });
    describe('set primitive value changes', () => {
        it('should create the proxy object', () => {
            const proxy = trackChanges(target, () => { });
            expect(proxy).toBeDefined();
        });

        it('should set the string property on watched object', () => {
            const proxy = getProxyWithoutWatcher();
            proxy.name = 'Sana';

            expect(target.name).toEqual('Sana');
        });

        it('should set the number property on watched object', () => {
            const proxy = getProxyWithoutWatcher();
            proxy.age = 20;

            expect(target.age).toEqual(20);
        });

        it('should set the boolean property on watched object', () => {
            const proxy = getProxyWithoutWatcher();
            proxy.isSmart = false;

            expect(target.isSmart).toEqual(false);
        });


    });
    describe('set nested object value changes', () => {
        it('set nested objects value change', () => {
            const proxy = getProxyWithoutWatcher();
            proxy.address.city = 'Vancouver';
            proxy.address.geo.encoding.type = 'gmap';

            expect(target.address.city).toEqual('Vancouver')
            expect(target.address.geo.encoding.type).toEqual('gmap')
        });

        it('sets nested object in an array property', () => {
            const proxy = getProxyWithoutWatcher();
            proxy.companies.professional[0].title = 'Principal Software Engineer'
            expect(target.companies.professional[0].title).toEqual('Principal Software Engineer')
        });
    });
    describe('get/set array values', () => {
        it('should get array value using index', () => {
            let array = [1, 2, 3];
            const watchedObject = getProxyWithoutWatcher(array)
            expect(watchedObject[0]).toEqual(1);
        });
        it('should set array value using index', () => {
            let array = [1, 2, 3];
            const watchedObject = getProxyWithoutWatcher(array);
            watchedObject[0] = 100;
            expect(array[0]).toEqual(100);
        });
        it('should set array value on a nested object using index', () => {
            const watchedObject = getProxyWithoutWatcher();
            watchedObject.companies.professional[0].title = 'Architect';
            expect(target.companies.professional[0].title).toEqual('Architect');
        });
        it('should push new value to array', () => {
            var hobbies = ['tennis'];
            const watchedObject = getProxyWithoutWatcher(hobbies);
            watchedObject.push('reading');
            expect(hobbies[1]).toEqual('reading');
        });
        it('should push new value to array property on an object', () => {
            const watchedObject = getProxyWithoutWatcher();
            watchedObject.hobbies.push('reading');
            expect(target.hobbies[1]).toEqual('reading');
        });
        it('should push new value to array property on a nested object', () => {
            const watchedObject = getProxyWithoutWatcher();
            watchedObject.companies.professional.push({ 'name': 'Google', 'title': 'Design Lead' });
            expect(target.companies.professional[2].name).toEqual('Google');
        });
        it('should set object item value in an array', () => {
            var hobbies = ['tennis', { type: 'amateur' }];
            const watchedObject = getProxyWithoutWatcher(hobbies);
            watchedObject[1].type = 'Pro'
            expect(hobbies[1].type).toEqual('Pro');
        });
        it('should pop value from array', () => {
            var hobbies = ['tennis'];
            const watchedObject = getProxyWithoutWatcher(hobbies);
            expect(watchedObject.pop()).toEqual('tennis');
        });
    });
    describe('delete properties', () => {
        it('should delete property on target', () => {
            const proxy = getProxyWithoutWatcher();
            delete proxy.age;
            expect(target.age).toBeUndefined();
        });
        it('should delete nested property on target', () => {
            const proxy = getProxyWithoutWatcher();
            delete proxy.address.geo.encoding;
            expect(target.address.geo.encoding).toBeUndefined();
        });
    });
    describe('define property', () => {
        it('should define a new property on target object', () => {
            let proxy = getProxyWithoutWatcher();
            Object.defineProperty(proxy, 'phone', { value: '94930302' });
            expect(target.phone).toEqual('94930302');
        });
    });
    describe('tracker function', () => {
        it('should invoke tracker function when accessing property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Get);
                expect(propertyKey).toEqual('name');
                expect(newValue).toEqual('furqan');
            };
            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            proxy.name;
            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when accessing nested property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Get);
                expect(propertyKey).toEqual('type');
                expect(newValue).toEqual('map');
            };
            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            proxy.address.geo.encoding.type;
            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when setting property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('name');
                expect(newValue).toEqual('Sana');
                expect(oldValue).toEqual('furqan');
                // expect(this.name).toEqual('Sana')
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            proxy.name = 'Sana';

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when setting nested property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('type');
                expect(newValue).toEqual('geo');
                expect(oldValue).toEqual('map');
                // expect(this.name).toEqual('furqan')
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            proxy.address.geo.encoding.type = 'geo';

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when setting nested array property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                // TODO: propertyKey is sent as "push". Needs to be fixed
                //expect(propertyKey).toEqual('professional');
                // expect(this.name).toEqual('furqan')
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            proxy.companies.professional.push({ 'name': 'Google', 'title': 'Design Lead' });

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when getting array value using index', () => {
            let hobbies = ['tennis'];
            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Get);
                expect(propertyKey).toEqual('0');
                expect(value).toEqual('tennis');
                // TODO: this is failing since this is passed as undefined to expect
                //expect(this).toBe(hobbies);
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(hobbies, mock);
            proxy[0];

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when setting array value using index', () => {
            let hobbies = ['tennis'];

            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('1');
                expect(value).toEqual('reading');
                // TODO: this is failing since this is passed as undefined to expect
                //expect(this).toEqual(hobbies)
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(hobbies, mock);
            proxy[1] = 'reading';

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when setting array value using push', () => {
            let hobbies = ['tennis'];

            const trackerFn = (opType, propertyKey, value, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('push');
                expect(value).toEqual(['tennis', 'reading']);
                // TODO: this is failing since this is passed as undefined to expect
                //expect(this).toEqual(hobbies)
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(hobbies, mock);
            proxy.push('reading');

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when deleting property', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Delete);
                expect(propertyKey).toEqual('type');
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            delete proxy.address.geo.encoding.type;

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker function when calling Object.assign', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual('phone');
                expect(newValue).toEqual('1234');
            };

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(target, mock);
            Object.assign(proxy, { 'phone': '1234' })

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker fn when setting object item value in an array', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Set);
                expect(propertyKey).toEqual(2);
                expect(newValue).toEqual(4);
            };
            let array = [1, 2, { a: 3 }];

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(array, mock);
            proxy[2].a = 4;

            expect(isInvoked(mock)).toBe(1);
        });
        it('should invoke tracker fn when calling sort on array', () => {
            const trackerFn = (opType, propertyKey, newValue, oldValue) => {
                expect(opType).toEqual(OpType.Sort);
                expect(newValue).toEqual([1,2,4,6,7]);
            };
            let array = [4,2,1,6,7];

            const mock = getMockedTrackerFn(trackerFn);
            const proxy = trackChanges(array, mock);
            proxy.sort();

            expect(isInvoked(mock)).toBe(1);
        });
    });
});


// validate input parameters - target must be object, trackerFn must be function
// setting value:
//     primitives
//        number
//        string
//        boolean
//        undefined
//     nested objects
//     nested arrays
//  delete property
//  tracker fn is invoked with correct parameters
//     get/set/delete/Object.assign/sort/push/pop
// Not supported:
//    defineProperty . Use set instead
