const deviceService = require('../services/deviceService');
const { successResponse } = require('../utils/response');

class DeviceController {
  async registerDevice(req, res, next) {
    try {
      const { deviceId } = req.body;
      const device = await deviceService.registerDevice(req.user.id, deviceId);
      return successResponse(res, device, 'Device registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDeviceStatus(req, res, next) {
    try {
      const deviceId = req.headers['x-device-id'];
      const status = await deviceService.getDeviceStatus(req.user.id, deviceId);
      return successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }

  async getPendingDevices(req, res, next) {
    try {
      const devices = await deviceService.getPendingDevices();
      return successResponse(res, devices);
    } catch (error) {
      next(error);
    }
  }

  async verifyDevice(req, res, next) {
    try {
      const { id } = req.params;
      const device = await deviceService.verifyDevice(id, req.user.id);
      return successResponse(res, device, 'Device verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectDevice(req, res, next) {
    try {
      const { id } = req.params;
      await deviceService.rejectDevice(id);
      return successResponse(res, null, 'Device rejected successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
