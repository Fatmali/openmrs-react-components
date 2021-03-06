
import { axiosInstance } from '../config';
import {DEFAULT_OBS_REP} from "../domain/obs/constants";

const api = {

  deleteObs: (obs) => {
    return axiosInstance.delete('obs/' + obs.uuid)
      .then((response) => {
        if (response.status != 204) {
          throw response;
        }
      });
  },

  fetchObsByPatient: (patient, concept, limit) => axiosInstance.get(`obs/?patient=${patient}&concept=${concept}&v=custom:${DEFAULT_OBS_REP}`
    + ( limit ? "&limit=" + limit : ''))
    .then((response) => {
      if (response.status !== 200) {
        throw response;
      } else {
        return response.data;
      }
    }),
};

export default api;
