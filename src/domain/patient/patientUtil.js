
// TODO this is *not* React specific and should be moved into another library?
// TODO is a full rep too big, we need to use a smaller size?
// TODO do we actually want to start storing the uuids for things like identifiers here? would be relevant if we ant to start using these utils to update
import * as R from 'ramda';
import  { cloneDeep } from 'lodash';
import { ATTRIBUTE_TYPES } from './constants';

/*

Given the full REST representation of an object, this class provides a util method "createFromRestRep" that
formats it into a simplified form.

Also provides util methods to operate on a Patient in this new form

{
  id : $id,
  uuid : $uuid,
  gender : $gender,
  age : $age,
  birthdate : $birthdate,
  name : {
    givenName : $givenName,
    middleName : $middleName,
    familyName : $familyName,
  },
  address : {
    display : $display,
    cityVillage : $cityVillage,
    stateProvince : $stateProvince,
    country : $country,
    postalCode : $postalCode
    ...
  },
  identifiers : [
    ...
    {
      identifier : $identifier,
      identifierType : {
        uuid: $uuid,
        // TODO add display and/or name?
      }
    }
    ...
  ],
  attributes : [
    ...
    {
      display: $display,
      uuid: $uuid,
      value: $value,
      attributeType: {
        uuid: $uuid,
        // TODO add display and/or name?
      }
    }
    ...
  ],
  visit: {
    ... if a visit is passed in along with a patient to the createPatientFromRestRep, it will be stored here
        intended as a means to store the active visit as a top-level element on a patient record
  }
  // TODO The following are implementation specific things which will be refactored and removed
  actions : $actions,
  alert : $alert,
  chw : $chw,
  village: $village
}
*/

const patientUtil = {

  getGivenName: (patient) =>  { return R.path(['name', 'givenName'], patient); },

  getMiddleName: (patient) => { return R.path(['name', 'middleName'], patient); },

  getFamilyName: (patient) => { return R.path(['name', 'familyName'], patient); },

  addIdentifier: (identifier, identifierType, patient) => {
    if (R.path(['identifiers'], patient)){
      if (!patient.identifiers.some((i) => i.identifier === identifier && i.identifierType.uuid === identifierType.uuid)) {
        patient.identifiers.push({ identifier: identifier, identifierType: identifierType });
      }
    }
    else if (patient) {
      patient.identifiers = [ { identifier: identifier, identifierType: identifierType } ];
    }
    else {
      patient = { identifiers : [ { identifier: identifier, identifierType: identifierType } ] };
    }
    return patient;
  },

  // finds identifier based on type, just returns first match
  getIdentifier: (patient, identifierType) => {
    const identifier = patientUtil.getIdentifiers(patient, identifierType);
    return identifier ? identifier[0] : null;
  },

  getIdentifiers: (patient, identifierType) => {
    return patient.identifiers
      .filter((i) => i.identifierType.uuid === identifierType.uuid)
      .map((i) => i.identifier);
  },

  getAddressDisplay: (patient) => { return R.path(['address', 'display'], patient); },

  getCityVillage: (patient) => { return R.path(['address', 'cityVillage'], patient); },

  getCountyDistrict: (patient) => { return R.path(['address', 'countyDistrict'], patient); },

  getStateProvince: (patient) => { return R.path(['address', 'stateProvince'], patient); },

  getCountry: (patient) => { return R.path(['address', 'country'], patient); },

  getPostalCode: (patient) => { return R.path(['address', 'postalCode'], patient); },

  getAddress1: (patient) =>  { return R.path(['address', 'address1'], patient); },

  getAddress2: (patient) =>  { return R.path(['address', 'address2'], patient); },

  getAddress3: (patient) =>  { return R.path(['address', 'address3'], patient); },

  getAddress4: (patient) =>  { return R.path(['address', 'address4'], patient); },

  getAddress5: (patient) =>  { return R.path(['address', 'address5'], patient); },

  getAddress6: (patient) =>  { return R.path(['address', 'address6'], patient); },

  // TODO cut-and-paste for address fields 7 to 15, or create this dynamically?

  // TODO make getter for any attribute type
  getTelephoneNumber: (patient) => {
    var attribute = patient.attributes.find((attribute) => {
      return (attribute.attributeType.uuid === ATTRIBUTE_TYPES.telephoneNumber.uuid); });
    return (R.path(['value'], attribute));
  },

  createFromRestRep: (restRep, visit) => {

    if (restRep._openmrsClass === 'Patient') {
      return cloneDeep(restRep);
    }

    let patient = {};

    patient._openmrsClass = 'Patient';
    patient.id = restRep.id;
    patient.uuid = restRep.uuid;
    patient.gender = R.path(['person', 'gender'], restRep);
    patient.age = R.path(['person', 'age'], restRep);
    patient.birthdate = R.path(['person', 'birthdate'], restRep);

    // Preferred Name

    patient.name = R.path(['person', 'preferredName'], restRep) ? {
      givenName: restRep.person.preferredName.givenName,
      middleName: restRep.person.preferredName.middleName,
      familyName: restRep.person.preferredName.familyName
    } : undefined;

    // Identifiers

    patient.identifiers = restRep.identifiers ?
      restRep.identifiers.filter((identifier) => {
        return !identifier.voided;
      }).map((identifier) => {
        return {
          identifier: identifier.identifier,
          identifierType: {
            uuid: identifier.identifierType.uuid
          }
        };
      }) : [];

    // Preferred Address

    patient.address = R.path(['person', 'preferredAddress'], restRep) ? {
      display: restRep.person.preferredAddress.display,
      cityVillage: restRep.person.preferredAddress.cityVillage,
      countyDistrict: restRep.person.preferredAddress.countyDistrict,
      stateProvince: restRep.person.preferredAddress.stateProvince,
      country: restRep.person.preferredAddress.country,
      postalCode: restRep.person.preferredAddress.postalCode,
      address1: restRep.person.preferredAddress.address1,
      address2: restRep.person.preferredAddress.address2,
      address3: restRep.person.preferredAddress.address3,
      address4: restRep.person.preferredAddress.address4,
      address5: restRep.person.preferredAddress.address5,
      address6: restRep.person.preferredAddress.address6
    } : {};

    // Attributes

    patient.attributes = R.path(['person', 'attributes'], restRep) ?
      restRep.person.attributes.filter((attribute) => {
        return !attribute.voided;
      }).map((attribute) => {
        return {
          display: attribute.display,
          uuid: attribute.uuid,
          value: attribute.value,
          attributeType: {
            uuid: attribute.attributeType.uuid
          },
        };
      }) : [];


    // add in the visit, if it has been specified
    patient.visit = (typeof visit !== 'undefined') ? visit :undefined;

    return patient;
  }

};

export default patientUtil;
