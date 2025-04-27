import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUpdateAddress } from '../../../hooks/useAddress'; 
import { UpdateAddressRequest } from '@/types/Address.type'; 
import MapWithAddress from './mapWithAddress'; 

interface UpdateAddressProps {
  addressId: string;
  currentAddress: UpdateAddressRequest;
}

const UpdateAddress: React.FC<UpdateAddressProps> = ({ addressId, currentAddress }) => {
 
  const [address, setAddress] = useState<UpdateAddressRequest>({
    ...currentAddress,  
    latitude: currentAddress.latitude || 0, 
    longitude: currentAddress.longitude || 0,  
  });

  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: currentAddress.latitude ?? null,  
    longitude: currentAddress.longitude ?? null,  
  });

  const { mutate: updateAddress } = useUpdateAddress(addressId); 
  const [isLoading, setIsLoading] = useState(false); 


  useEffect(() => {
    setCoordinates({
      latitude: currentAddress.latitude ?? null, 
      longitude: currentAddress.longitude ?? null,
    });
    setAddress({
      ...currentAddress,
      latitude: currentAddress.latitude || 0, 
      longitude: currentAddress.longitude || 0,
    });
  }, [currentAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (coordinates.latitude === null || coordinates.longitude === null) {
      toast.error('Vui lòng chọn vị trí trên bản đồ.');
      return;
    }

   
    setIsLoading(true);

   
    updateAddress({
      ...address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });

  
    setIsLoading(false);
  };

  return (
    <div>
      <h3>Cập nhật địa chỉ</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={address.name}
          onChange={handleChange}
          required
          placeholder="Tên"
        />
        <input
          type="text"
          name="phone"
          value={address.phone}
          onChange={handleChange}
          required
          placeholder="Số điện thoại"
        />
        <input
          type="text"
          name="address_line1"
          value={address.address_line1}
          onChange={handleChange}
          required
          placeholder="Địa chỉ 1"
        />
        <input
          type="text"
          name="address_line2"
          value={address.address_line2}
          onChange={handleChange}
          placeholder="Địa chỉ 2"
        />
        <input
          type="text"
          name="city"
          value={address.city}
          onChange={handleChange}
          required
          placeholder="Thành phố"
        />
        <input
          type="text"
          name="state"
          value={address.state}
          onChange={handleChange}
          required
          placeholder="Tỉnh"
        />
        <input
          type="text"
          name="postal_code"
          value={address.postal_code}
          onChange={handleChange}
          required
          placeholder="Mã bưu điện"
        />
        <input
          type="text"
          name="country"
          value={address.country}
          onChange={handleChange}
          required
          placeholder="Quốc gia"
        />
        <MapWithAddress setCoordinates={setCoordinates} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
        </button>
      </form>
    </div>
  );
};

export default UpdateAddress;
